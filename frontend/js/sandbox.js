// Sandbox: vê e testa todas as cenas do jogo em Phaser, SEM backend.
// Usa exactamente o mesmo desenho do jogo (sprites.js, cenas.js, mundo.js) e o mesmo palco pixelado.
import { R, robo, estrelas, terra, nave, cl, PERSONAGENS } from "./sprites.js";
import * as cenas from "./cenas.js";
import * as mundo from "./mundo.js";
import { iniciarPalco } from "./palco.js";
import { complexo } from "./complexo.js";

const $ = (s) => document.querySelector(s);

// ── estado falso, com os campos que as funções de desenho precisam ──
const G = {
  ecra: "jogo",
  cosm: { char: "amelia", nave: "aurora" },
  vista: {
    eu: "a",
    jogadores: [
      { id: "a", nickname: "Tu", nome: "Tu", ligado: true, anfitriao: true, x: 0 },
      { id: "b", nickname: "Colega", nome: "Colega", ligado: true, x: 4 },
    ],
    estado: {
      destino: "marte",
      fase: "viagem",
      horas_rota: 40,
      duracao_horas: 100,
      desafio: null,
      ajuste_rota: 0,
      piloto: null,
      prontos: [],
      pouso: 0,
      descarregada: true,
      carga: { rover: true },
      montados: [],
      descobertas: [],
      recursos: { energia: 70 },
      superficie: null,
    },
  },
  lobbyX: -4,
  lobbyVirado: false,
  lobbyAnda: false,
  rotaP: 0.4,
  rotaFora: 0,
  camY: 0,
  bloqueado: false,
  dentro: { x: 420, virado: false, anda: 0 },
  eva: { ox: 300, rocha: false, solo: 2, gelo: 1, cavados: {}, saidas: 0, emergencias: 0 },
  pegadas: [],
  roverM: mundo.POS.rover,
  jog: {
    m: 2, y: 0, vy: 0, virado: false, anda: 0, aAndar: false, pe: 0,
    poeira: null, noAr: 0, ultimoSalto: 0, rover: false, cavar: 0, ferramenta: "pa",
  },
  tecla: { esq: 0, dir: 0, salto: 0 },
  marcos: () => [0.33, 0.72],
  nomeDe: (id) => (id === "a" ? "Tu" : "Colega"),
  outroChar: () => "kito",
  tempestade: (e) => !!e.desafio && e.desafio.id === "tempestade",
  sup: () => null,
  estaFora: () => false,
  condutor: () => null,
};
const E = G.vista.estado;

// ── cenas ──
const CENAS = [
  ["lobby", "Lobby"],
  ["descolagem", "Descolagem"],
  ["rota", "Rota"],
  ["aterragem", "Aterragem"],
  ["superficie", "Superfície"],
  ["complexo", "Complexo (cima)"],
  ["interior", "Base (dentro)"],
];
let cena = "superficie",
  u = 0;
const info = {
  lobby: "Anda com as setas.",
  descolagem: "Animação de 9 s em ciclo.",
  rota: "Mexe na barra «Viagem».",
  aterragem: "Animação de 8 s em ciclo.",
  superficie: "Anda e salta. A gravidade muda com o destino.",
  interior: "Anda pela cabine ou pelo habitat.",
  complexo: "Setas ou WASD andam nas 4 direcções. Sai pela antecâmara.",
};
function mudar(c) {
  cena = c;
  u = 0;
  G.camY = 0;
  G.jog.m = 2;
  G.dentro.x = 420;
  document.querySelectorAll("#cenas button").forEach((b) => b.classList.toggle("sel", b.dataset.c === c));
  $("#g-rota").style.display = c === "rota" ? "" : "none";
  $("#info").textContent = info[c];
  try { location.hash = c; } catch { /* ok */ }
}
CENAS.forEach(([k, nome]) => {
  const b = document.createElement("button");
  b.textContent = nome;
  b.dataset.c = k;
  b.onclick = () => mudar(k);
  $("#cenas").append(b);
});

// ── controlos ──
$("#destino").onchange = (e) => (E.destino = e.target.value);
$("#nave").onchange = (e) => (G.cosm.nave = e.target.value);
$("#char").onchange = (e) => (G.cosm.char = e.target.value);
["energia", "radio", "habitat"].forEach((k) =>
  ($("#" + k).onchange = () => {
    E.montados = ["energia", "radio", "habitat"].filter((x) => $("#" + x).checked);
  }),
);
$("#tempestade").onchange = (e) => (E.desafio = e.target.checked ? { id: "tempestade" } : null);
$("#prog").oninput = (e) => (E.horas_rota = (e.target.value / 100) * E.duracao_horas);

const TEC = { ArrowLeft: "esq", a: "esq", A: "esq", ArrowRight: "dir", d: "dir", D: "dir", " ": "salto", ArrowUp: "cima", w: "cima", W: "cima", ArrowDown: "baixo", s: "baixo", S: "baixo" };
addEventListener("keydown", (ev) => {
  if (ev.target.matches("select,input")) return;
  const k = TEC[ev.key];
  if (k) { G.tecla[k] = 1; ev.preventDefault(); }
});
addEventListener("keyup", (ev) => {
  const k = TEC[ev.key];
  if (k) G.tecla[k] = 0;
});

// ── a Nia (robô) com balão de fala ──
const FALAS = [
  "Olá! Sou a Nia, a tua guia de voo. Antes de cada decisão explico-te a ciência de que precisas.",
  "Pousa-se onde é seguro, mesmo que a carga fique longe. Depois estuda-se o terreno e marca-se um caminho.",
  "Dentro da base respiras o ar dela. Lá fora usas o traje e o tanque dura 5 minutos. Planeia a ida e a volta!",
];
let fala = 0,
  pisca = false;
function robos() {
  document.querySelectorAll("canvas[data-robo]").forEach((cv) => {
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    robo(c, 0, 14, 6, pisca);
  });
}
function mostrarNia() {
  $("#ui").innerHTML = `<div style="position:absolute;left:150px;bottom:60px;width:980px"><div class="guia"><canvas data-robo="1" width="96" height="116"></canvas><div class="bal"><div class="t" style="margin-bottom:4px"><span class="teal">Nia · a tua guia</span></div><div style="font-size:15px;line-height:1.5">${FALAS[fala % FALAS.length]}</div><div class="lin" style="margin-top:10px"><button class="pri" id="seg">SEGUINTE ►</button><button id="fecha">Fechar</button></div></div></div></div>`;
  robos();
  $("#seg").onclick = () => { fala++; mostrarNia(); };
  $("#fecha").onclick = () => ($("#ui").innerHTML = "");
}
$("#nia").onclick = mostrarNia;

// ── ciclo ──
let ult = performance.now(),
  q = 0;
function quadro(agora, c) {
  const dt = Math.min(0.05, (agora - ult) / 1000),
    t = agora / 1000;
  ult = agora;
  q++;
  c.imageSmoothingEnabled = false;
  c.textBaseline = "alphabetic";
  const p = t % 3.4 < 0.14;
  if (p !== pisca) { pisca = p; robos(); }
  const m = G.tecla.dir - G.tecla.esq;
  if (cena === "lobby") {
    R(c, 0, 0, 1280, 720, "#0b1030");
    G.lobbyAnda = !!m;
    if (m) { G.lobbyX = cl(G.lobbyX + m * 5 * dt, -10.2, 10.2); G.lobbyVirado = m < 0; }
    cenas.lobby(c, t, G);
  } else if (cena === "descolagem") {
    u += dt;
    if (u > 9) u = 0;
    cenas.descolagem(c, u, G.cosm.nave, q);
  } else if (cena === "aterragem") {
    u += dt;
    if (u > 8) u = 0;
    cenas.aterragem(c, u, E.destino, G.cosm.nave, q);
  } else if (cena === "rota") {
    cenas.rota(c, t, dt, G);
  } else if (cena === "superficie") {
    mundo.superficie(c, t, dt, G);
  } else if (cena === "complexo") {
    complexo(c, t, dt, G);
  } else {
    mundo.interior(c, t, dt, G);
  }
}

mudar(location.hash.slice(1) && CENAS.some((c) => c[0] === location.hash.slice(1)) ? location.hash.slice(1) : cena);
iniciarPalco($("#cv"), quadro);

// o palco de 1280×720 ajusta-se ao espaço livre debaixo da barra
function escala() {
  const d = document.documentElement,
    W = d.clientWidth,
    H = d.clientHeight - 84,
    k = Math.min(W / 1280, H / 720),
    p = $("#palco");
  p.style.transform = `scale(${k})`;
  p.style.left = (W - 1280 * k) / 2 + "px";
  p.style.top = 84 + (H - 720 * k) / 2 + "px";
}
addEventListener("resize", escala);
escala();
window.__G = G;
window.__mudar = mudar;

// ── vento (0 = calmo, 1 = tempestade; só em Marte) ──
const sv = $("#vento");
if (sv) {
  sv.oninput = (e) => {
    G.ventoManual = e.target.value / 100;
  };
  sv.onchange = () => sv.blur(); // devolve as setas ao boneco
  $("#ventoAuto").onclick = (e) => {
    G.ventoManual = null;
    sv.value = 25;
    e.target.blur();
  };
}