from email.message import EmailMessage
from hashlib import scrypt, sha256
from hmac import compare_digest
import os
from pathlib import Path
import re
import secrets
import smtplib
import ssl
from threading import BoundedSemaphore
from time import time
from urllib.parse import urlsplit
from uuid import uuid4

from psycopg.errors import UniqueViolation

from .config import BACKEND, BD
from .db import ligacao, transaccao
from .erros import Erro
from .privacidade import IDADE_CONSENTIMENTO

PUBLICO = os.getenv("ASTRO_PUBLIC_URL", "http://127.0.0.1:8000").rstrip("/")
DOMINIO = urlsplit(PUBLICO)
MODO_EMAIL = os.getenv("ASTRO_EMAIL_MODO", "local")
MENORES_PERMITIDOS = MODO_EMAIL == "local" or os.getenv("ASTRO_PILOTO_FAMILIAR", "0") == "1"
COOKIE = "astro_sessao"
DURACAO_SESSAO = 7 * 86400
DURACAO_LINK = 45 * 60
SLOT_SCRYPT = BoundedSemaphore(2)
EMAIL = re.compile(r"[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+", re.ASCII)
CODIGO = re.compile(r"[A-Za-z0-9_-]{43}")
NICKNAME = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_]{2,19}")


def hash_(valor):
    return sha256(valor.encode("utf-8")).hexdigest()


def validar_configuracao():
    if (DOMINIO.scheme not in ("http", "https") or not DOMINIO.hostname or DOMINIO.path
            or DOMINIO.query or DOMINIO.fragment or DOMINIO.username or DOMINIO.password):
        raise RuntimeError("ASTRO_PUBLIC_URL deve ser apenas a origem do jogo.")
    if MODO_EMAIL not in ("local", "smtp"):
        raise RuntimeError("ASTRO_EMAIL_MODO deve ser local ou smtp.")
    if MODO_EMAIL == "smtp":
        if DOMINIO.scheme != "https":
            raise RuntimeError("Configura ASTRO_PUBLIC_URL com HTTPS para enviar email real.")
        if not all(os.getenv(k) for k in ("ASTRO_SMTP_HOST", "ASTRO_SMTP_DE", "ASTRO_SMTP_UTILIZADOR", "ASTRO_SMTP_SENHA")):
            raise RuntimeError("Preenche os campos ASTRO_SMTP no ficheiro .env.")
    elif DOMINIO.scheme == "https":
        raise RuntimeError("O modo local de email destina-se à demo HTTP.")


def normalizar_email(email):
    if not isinstance(email, str):
        raise Erro(400, "Indica um endereço de email válido.")
    email = email.strip().lower()
    if len(email) > 254 or not EMAIL.fullmatch(email):
        raise Erro(400, "Indica um endereço de email válido.")
    local = email.split("@", 1)[0]
    if len(local) > 64 or local.startswith(".") or local.endswith(".") or ".." in local:
        raise Erro(400, "Indica um endereço de email válido.")
    return email


def normalizar_nickname(nickname):
    if isinstance(nickname, str):
        nickname = nickname.strip().removeprefix("@")
        if NICKNAME.fullmatch(nickname):
            return nickname.lower()
    raise Erro(400, "Usa 3 a 20 letras, números ou _, começando por uma letra ou número.")


def bloquear_email(conn, email):
    conn.execute("SELECT pg_advisory_xact_lock(741205319, hashtext(%s))", (email,))


def derivar(senha, salt):
    if not SLOT_SCRYPT.acquire(timeout=8):
        raise Erro(429, "Aguarda antes de tentar novamente.")
    try:
        return scrypt(senha.encode(), salt=bytes.fromhex(salt), n=2**17, r=8, p=1,
                      maxmem=192 * 1024 * 1024, dklen=32).hex()
    finally:
        SLOT_SCRYPT.release()


def enviar_confirmacao(email, codigo, *, responsavel=False):
    accao = "autorizar" if responsavel else "confirmar"
    link = f"{PUBLICO}/#{accao}={codigo}"
    if MODO_EMAIL == "local":
        pasta = BACKEND / "emails_demo"
        pasta.mkdir(mode=0o700, exist_ok=True)
        with (pasta / f"{secrets.token_hex(12)}.txt").open("x", encoding="utf-8") as destino:
            destino.write(f"Para: {email}\nConfirmação (45 min): {link}\n")
        return

    mensagem = EmailMessage()
    mensagem["Subject"] = ("Pedido de autorização" if responsavel else "Confirma o teu email") + " · Pequenos Astronautas"
    mensagem["From"] = os.environ["ASTRO_SMTP_DE"]
    mensagem["To"] = email
    instrucoes = ("Um jogador indicou este email como contacto de um responsável. Abre o link para ler "
                  "como funciona o jogo em equipa e decidir se autorizas." if responsavel else
                  "Abre o link para confirmar o email e criar a conta.")
    mensagem.set_content(f"{instrucoes}\n{link}\n\nO link expira em 45 minutos.")
    host = os.environ["ASTRO_SMTP_HOST"]
    porta = int(os.getenv("ASTRO_SMTP_PORTA", "587"))
    contexto = ssl.create_default_context()
    if porta == 465:
        cliente = smtplib.SMTP_SSL(host, porta, timeout=8, context=contexto)
    else:
        cliente = smtplib.SMTP(host, porta, timeout=8)
    with cliente:
        if porta != 465:
            cliente.starttls(context=contexto)
        cliente.login(os.environ["ASTRO_SMTP_UTILIZADOR"], os.environ["ASTRO_SMTP_SENHA"])
        cliente.send_message(mensagem)


class Limites:
    def __init__(self, bd):
        self.bd = bd

    def verificar(self, chave, maximo, segundos):
        agora = int(time())
        janela = agora // segundos
        with ligacao(self.bd) as conn:
            fila = conn.execute(
                "INSERT INTO limites_pedidos VALUES (%s, %s, %s, 1) "
                "ON CONFLICT (chave, janela) DO UPDATE SET total = limites_pedidos.total + 1 "
                "WHERE limites_pedidos.total < %s RETURNING total",
                (hash_(repr(chave)), janela, (janela + 1) * segundos, maximo),
            ).fetchone()
        if not fila:
            raise Erro(429, "Muitas tentativas. Tenta novamente mais tarde.")


class Contas:
    def __init__(self, bd=BD, enviar=enviar_confirmacao, enviar_responsavel=None):
        self.bd = bd
        self.enviar = enviar
        self.enviar_responsavel = enviar_responsavel or (lambda email, codigo: enviar_confirmacao(
            email, codigo, responsavel=True))
        self.limites = Limites(bd)

    def pedir_confirmacao(self, email, ip, idade=None):
        if not MENORES_PERMITIDOS and (type(idade) is not int or not IDADE_CONSENTIMENTO <= idade <= 120):
            raise Erro(403, "O registo abaixo dos 15 anos está disponível apenas no piloto familiar.")
        email = normalizar_email(email)
        self.limites.verificar(("pedir", ip), 100, 3600)
        agora = int(time())
        codigo = secrets.token_urlsafe(32)
        codigo_hash = hash_(codigo)
        with ligacao(self.bd) as conn:
            conn.execute("DELETE FROM verificacoes_email WHERE expira_em <= %s", (agora,))
            with transaccao(conn):
                bloquear_email(conn, email)
                if conn.execute("SELECT 1 FROM contas WHERE email = %s", (email,)).fetchone():
                    return
                anterior = conn.execute(
                    "SELECT criada_em FROM verificacoes_email WHERE email = %s", (email,),
                ).fetchone()
                if anterior and anterior["criada_em"] > agora - 60:
                    return
                conn.execute(
                    "INSERT INTO verificacoes_email VALUES (%s, %s, %s, %s) "
                    "ON CONFLICT(email) DO UPDATE SET codigo_hash=excluded.codigo_hash, "
                    "expira_em=excluded.expira_em, criada_em=excluded.criada_em",
                    (email, codigo_hash, agora + DURACAO_LINK, agora),
                )
        try:
            self.enviar(email, codigo)
        except (OSError, smtplib.SMTPException):
            with ligacao(self.bd) as conn:
                conn.execute("DELETE FROM verificacoes_email WHERE codigo_hash = %s", (codigo_hash,))
            raise Erro(503, "Não foi possível enviar o email. Tenta novamente.") from None

    def confirmar(self, codigo, nome, idade, senha, ip, nickname):
        self.limites.verificar(("confirmar", ip), 100, 3600)
        if not isinstance(codigo, str) or not CODIGO.fullmatch(codigo):
            raise Erro(400, "O link de confirmação é inválido ou expirou.")
        if not isinstance(nome, str) or not 1 <= len(nome.strip()) <= 24 or not nome.strip().isprintable():
            raise Erro(400, "Indica um nome de astronauta com 1 a 24 caracteres.")
        if type(idade) is not int or not 8 <= idade <= 120:
            raise Erro(400, "Indica uma idade entre 8 e 120 anos.")
        if idade < IDADE_CONSENTIMENTO and not MENORES_PERMITIDOS:
            raise Erro(403, "O acesso abaixo dos 15 anos está disponível apenas no piloto familiar.")
        if not isinstance(senha, str) or not 12 <= len(senha) <= 128:
            raise Erro(400, "A palavra-passe deve ter de 12 a 128 caracteres.")
        nickname = normalizar_nickname(nickname)
        codigo_hash = hash_(codigo)
        consulta = "SELECT email FROM verificacoes_email WHERE codigo_hash = %s AND expira_em > %s"
        with ligacao(self.bd) as conn:
            pedido = conn.execute(consulta, (codigo_hash, int(time()))).fetchone()
            if pedido is None:
                raise Erro(400, "O link de confirmação é inválido ou expirou.")
        salt = secrets.token_hex(16)
        segredo = derivar(senha, salt)
        agora = int(time())
        with ligacao(self.bd) as conn, transaccao(conn):
            email = pedido["email"]
            bloquear_email(conn, email)
            if not conn.execute(consulta, (codigo_hash, int(time()))).fetchone():
                raise Erro(400, "O link de confirmação é inválido ou expirou.")
            criada = conn.execute(
                "INSERT INTO contas(id, email, nome, idade, senha_salt, senha_hash, confirmada_em, nickname) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (nickname) DO NOTHING RETURNING id",
                (uuid4().hex, email, nome.strip(), idade, salt, segredo, agora, nickname),
            ).fetchone()
            if not criada:
                raise Erro(409, "Este nickname já está em uso. Escolhe outro.")
            conn.execute("DELETE FROM verificacoes_email WHERE codigo_hash = %s", (codigo_hash,))
        return {"confirmada": True}

    def entrar(self, email, senha, ip):
        self.limites.verificar(("login", ip), 120, 900)
        email = normalizar_email(email)
        self.limites.verificar(("email-login", hash_(email)), 8, 900)
        if not isinstance(senha, str) or not 1 <= len(senha) <= 128:
            raise Erro(401, "Email ou palavra-passe inválidos.")
        with ligacao(self.bd) as conn:
            conta = conn.execute("SELECT * FROM contas WHERE email = %s", (email,)).fetchone()
        candidato = derivar(senha, conta["senha_salt"] if conta else "00" * 16)
        if not compare_digest(candidato, conta["senha_hash"] if conta else "00" * 32) or conta is None:
            raise Erro(401, "Email ou palavra-passe inválidos.")
        if conta["idade"] < IDADE_CONSENTIMENTO and not MENORES_PERMITIDOS:
            raise Erro(403, "O acesso abaixo dos 15 anos está disponível apenas no piloto familiar.")
        token = secrets.token_urlsafe(32)
        agora = int(time())
        with ligacao(self.bd) as conn, transaccao(conn):
            conn.execute("DELETE FROM sessoes_conta WHERE expira_em <= %s", (agora,))
            conn.execute("INSERT INTO sessoes_conta VALUES (%s, %s, %s)",
                         (hash_(token), conta["id"], agora + DURACAO_SESSAO))
        return self.perfil(conta), token

    def verificar(self, token):
        if not CODIGO.fullmatch(token):
            raise Erro(401, "Entra na tua conta para continuar.")
        with ligacao(self.bd) as conn:
            conta = conn.execute(
                "SELECT c.* FROM contas c JOIN sessoes_conta s ON s.conta = c.id "
                "WHERE s.token_hash = %s AND s.expira_em > %s", (hash_(token), int(time()))
            ).fetchone()
        if conta is None or (conta["idade"] < IDADE_CONSENTIMENTO and not MENORES_PERMITIDOS):
            raise Erro(401, "Entra na tua conta para continuar.")
        return self.perfil(conta)

    def definir_nickname(self, perfil, nickname):
        nickname = normalizar_nickname(nickname)
        try:
            with ligacao(self.bd) as conn, transaccao(conn):
                conta = conn.execute(
                    "SELECT * FROM contas WHERE id = %s FOR NO KEY UPDATE", (perfil["id"],),
                ).fetchone()
                actual = conta["nickname"]
                if actual == nickname:
                    return self.perfil(conta)
                if actual is not None:
                    raise Erro(409, "A tua conta já tem um nickname.")
                conn.execute("UPDATE contas SET nickname = %s WHERE id = %s", (nickname, perfil["id"]))
        except UniqueViolation:
            raise Erro(409, "Este nickname já está em uso. Escolhe outro.") from None
        return {**perfil, "nickname": nickname}

    def pedir_consentimento(self, conta, email):
        email = normalizar_email(email)
        if conta["idade"] >= IDADE_CONSENTIMENTO or conta["consentimento"]:
            raise Erro(409, "A conta já pode participar em equipa.")
        if email == conta["email"]:
            raise Erro(400, "Indica um email diferente, pertencente ao responsável.")
        self.limites.verificar(("consentimento", conta["id"]), 3, 3600)
        self.limites.verificar(("responsavel", email), 10, 3600)
        codigo = secrets.token_urlsafe(32)
        segredo = hash_(codigo)
        with ligacao(self.bd) as conn:
            conn.execute(
                "INSERT INTO consentimentos VALUES (%s, %s, %s, %s) "
                "ON CONFLICT (conta_email) DO UPDATE SET responsavel_email=excluded.responsavel_email, "
                "codigo_hash=excluded.codigo_hash, expira_em=excluded.expira_em",
                (conta["email"], email, segredo, int(time()) + DURACAO_LINK),
            )
        try:
            self.enviar_responsavel(email, codigo)
        except (OSError, smtplib.SMTPException):
            with ligacao(self.bd) as conn:
                conn.execute("DELETE FROM consentimentos WHERE codigo_hash=%s", (segredo,))
            raise Erro(503, "Não foi possível enviar o pedido ao responsável.") from None
        return {"modo_local": MODO_EMAIL == "local"}

    def autorizar(self, codigo, aceite, ip):
        self.limites.verificar(("autorizar", ip), 50, 3600)
        if aceite is not True or not isinstance(codigo, str) or not CODIGO.fullmatch(codigo):
            raise Erro(400, "Confirma a autorização com o link recebido.")
        agora = int(time())
        with ligacao(self.bd) as conn, transaccao(conn):
            pedido = conn.execute(
                "DELETE FROM consentimentos WHERE codigo_hash=%s AND expira_em>%s RETURNING conta_email",
                (hash_(codigo), agora),
            ).fetchone()
            if not pedido:
                raise Erro(400, "O link de autorização é inválido ou expirou.")
            conn.execute("UPDATE contas SET consentimento_em=%s WHERE email=%s",
                         (agora, pedido["conta_email"]))
        return {"autorizada": True}

    def sair(self, token):
        if CODIGO.fullmatch(token):
            with ligacao(self.bd) as conn:
                conn.execute("DELETE FROM sessoes_conta WHERE token_hash = %s", (hash_(token),))

    @staticmethod
    def perfil(conta):
        idade = conta["idade"]
        nivel = "cadete" if idade <= 11 else "piloto" if idade <= 14 else "comandante"
        return {"id": conta["id"], "nome": conta["nome"], "idade": idade,
                "email": conta["email"], "nivel": nivel, "nickname": conta["nickname"],
                "consentimento": bool(conta["consentimento_em"])}

