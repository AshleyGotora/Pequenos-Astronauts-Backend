// js/astrosuave.js — astronauta liso e arredondado (modo "suave").
// Mesma assinatura que astro(). (x, y) = canto da caixa 16×27 do desenho pixel, s = escala.
// Os pés ficam ancorados ao mesmo sítio; o desenho sai ~1,4× maior.
// Vento: Estilo.vento (0..1) abana antena, rabo e cabelo.
import { PERSONAGENS, TRAJES, mistura } from "./sprites.js";

const TAU = Math.PI * 2;
const CABELO = { puffs: "#1c1410", pony: "#4a2a14", curly: "#1c1410", beard: "#2b1a10" };

export function astroSuave(c, x, y, s, quem, traje, capacete, virado = false, anda = null) {
  const Es = window.Estilo,
    pal = Es.pal;
  const p = PERSONAGENS[quem] || PERSONAGENS.amelia;
  const S = TRAJES[traje] || TRAJES.cabine;
  const gordo = traje === "lua";
  const capa = !!capacete && traje !== "cabine";
  const t = performance.now() / 1000;
  const vento = Es.vento || 0;
  const raj = vento * (1 + 0.35 * Math.sin(t * 9) + 0.2 * Math.sin(t * 23));
  const k = s * 1.4;
  const lw = Math.max(0.45, Es.larg / k);
  const col = S.c,
    sh = mistura(col, "#1b1633", 0.25),
    K = "#262c52";
  const anda_ = !!anda;
  const ph = anda_ ? ((anda * 7) * Math.PI) / 2 : 0;
  const sw = anda_ ? Math.sin(ph) : 0;
  const bob = anda_ ? Math.abs(Math.cos(ph)) * 0.7 : 0;
  const resp = anda_ ? 0 : Math.sin(t * 2.6) * 0.012;

  c.save();
  // sombra no chão
  c.fillStyle = pal.sombra;
  c.beginPath();
  c.ellipse(x + 8 * s, y + 26 * s + 0.2 * k, 6.5 * k, 1.5 * k, 0, 0, TAU);
  c.fill();
  c.translate(x + 8 * s, y + 26 * s);
  c.scale(virado ? k : -k, k);
  c.scale(1, 1 + resp);
  c.translate(0, -bob);

  const ct = (f, cor, w) => Es.contorno(c, f, cor, w || lw);
  const rr = (X, Y, W, H, r) => (cc) => Es.rr(cc, X, Y, W, H, r);
  const circ = (X, Y, r) => (cc) => cc.arc(X, Y, r, 0, TAU);
  const fillp = (f, cor, a = 1) => {
    c.globalAlpha = a;
    c.beginPath();
    f(c);
    c.fillStyle = cor;
    c.fill();
    c.globalAlpha = 1;
  };

  // antena (Marte), abana com o vento
  if (traje === "marte") {
    const ax = 6.6,
      ay = -16.5,
      tx = ax + 0.8 + raj * 2.4,
      ty = -23.5;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(ax, ay);
    c.quadraticCurveTo(ax + raj * 2, (ay + ty) / 2, tx, ty);
    c.strokeStyle = pal.contorno;
    c.lineWidth = 0.9 + lw;
    c.stroke();
    c.strokeStyle = "#9aa3c7";
    c.lineWidth = 0.9;
    c.stroke();
    ct(circ(tx, ty, 0.95), "#e8403f", lw * 0.8);
  }

  // mochila de oxigénio
  if (traje !== "cabine") {
    const pk = rr(3.6, -16.5, 4.8, 9.5, 2);
    ct(pk, gordo ? "#9aa3c7" : mistura(col, "#1b1633", 0.35));
    fillp(rr(5.2, -15, 1.2, 6, 0.6), "#fff", 0.25);
  }

  // pernas (alternam ao andar)
  const perna = (cx, lift) => {
    const bx = cx + (anda_ ? sw * (cx < 0 ? 1 : -1) * 1.4 : 0),
      lg = gordo ? 1.9 : 1.6;
    ct(rr(bx - lg, -7 - lift, lg * 2, 7, 1.5), col);
    if (traje === "lua" || traje === "marte") fillp(rr(bx - lg, -5 - lift, lg * 2, 0.9, 0), S.a);
    ct(rr(bx - lg - 0.5, -2.4 - lift, lg * 2 + 1, 2.6, 1.2), S.bota);
  };
  perna(-2.1, anda_ ? Math.max(0, sw) * 1.2 : 0);
  perna(2.1, anda_ ? Math.max(0, -sw) * 1.2 : 0);

  // corpo
  const bw = gordo ? 5.8 : 5;
  const corpo = rr(-bw, -17.5, bw * 2, 12.8, 4.6);
  ct(corpo, col);
  Es.sombra(c, corpo, sh, -1.6, -1.6);
  c.save();
  c.beginPath();
  corpo(c);
  c.clip();
  c.fillStyle = S.a;
  c.fillRect(-bw, -9.4, bw * 2, 1.5);
  c.restore();
  if (traje === "cabine") {
    c.beginPath();
    c.moveTo(0, -16.2);
    c.lineTo(0, -9.6);
    c.strokeStyle = "rgba(0,0,0,0.3)";
    c.lineWidth = 0.35;
    c.stroke();
    fillp(circ(2.6, -13.4, 0.9), S.a);
  } else {
    fillp(rr(-3.2, -15, 6.4, 4.2, 1.1), gordo ? "#cfd6f5" : K);
    const led = (X, f) => fillp(circ(X, -12.9, 0.55), f);
    if (traje === "voo") (led(-1.8, "#4a7bd1"), led(0, "#e8403f"), led(1.8, "#ffd84d"));
    if (traje === "lua") (led(-1.6, "#e8403f"), led(0, "#ffd84d"));
    if (traje === "marte") (led(-1.6, S.a), led(0, "#fff"));
    if (traje === "lua") fillp(rr(-2.4, -11.8, 4.8, 0.5, 0), K);
  }

  // gola
  if (traje !== "cabine") ct(rr(-4.2, -18.4, 8.4, 2.6, 1.2), S.a, lw * 0.8);

  // braços e luvas
  const braco = (side, ang) => {
    const aw = gordo ? 1.7 : 1.4;
    c.save();
    c.translate(side * (bw - 0.2), -15.2);
    c.rotate(ang);
    ct(rr(-aw, -0.6, aw * 2, 7, aw), col);
    if (traje !== "cabine") fillp(rr(-aw, 3.4, aw * 2, 0.9, 0), S.a);
    ct(circ(0, 7.2, aw + 0.45), S.luva || p.pele);
    c.restore();
  };
  braco(-1, 0.08);
  braco(1, -0.08);

  // ── cabeça ──
  const cab = p.cabelo,
    hc = CABELO[cab] || "#1c1410";
  const olhos = (fx, fy, fr) => {
    const piscar = t % 3.6 < 0.12 ? 0.2 : 1;
    for (const sg of [-1, 1]) {
      const ex = fx + sg * fr * 0.38 - fr * 0.08,
        ey = fy + fr * 0.2;
      c.beginPath();
      c.ellipse(ex, ey, fr * 0.11, fr * 0.17 * piscar, 0, 0, TAU);
      c.fillStyle = "#1a1a2e";
      c.fill();
      if (piscar === 1) fillp(circ(ex - fr * 0.03, ey - fr * 0.06, fr * 0.04), "#fff");
      if (cab === "curly") {
        c.beginPath();
        c.arc(ex, ey, fr * 0.27, 0, TAU);
        c.strokeStyle = "#e8ecff";
        c.lineWidth = 0.35;
        c.stroke();
      }
    }
    if (cab === "curly") {
      c.beginPath();
      c.moveTo(fx - fr * 0.08 - fr * 0.11, fy + fr * 0.2);
      c.lineTo(fx - fr * 0.08 + fr * 0.11, fy + fr * 0.2);
      c.strokeStyle = "#e8ecff";
      c.lineWidth = 0.35;
      c.stroke();
    }
    if (cab !== "beard") {
      c.beginPath();
      c.arc(fx - fr * 0.08, fy + fr * 0.38, fr * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
      c.strokeStyle = "#5b2a22";
      c.lineWidth = 0.3;
      c.stroke();
    }
  };
  const cabelo = (parte, fx, fy, fr, fora) => {
    const ctop = (f, cor) => (fora ? ct(f, cor, lw * 0.8) : fillp(f, cor));
    const o = raj * fr * 0.15;
    if (parte === "tras") {
      if (cab === "puffs")
        for (const sg of [-1, 1]) ctop(circ(fx + sg * fr * 0.98 + o, fy - fr * 0.9, fr * 0.5), hc);
      if (cab === "pony") {
        const of = raj * fr * 0.6;
        ctop((cc) => cc.ellipse(fx + fr * 1.05 + of, fy + fr * 0.25, fr * 0.33, fr * 0.85, -0.2 - raj * 0.5, 0, TAU), hc);
        ctop(circ(fx + fr * 0.95, fy - fr * 0.2, fr * 0.2), "#ffd84d");
      }
      if (cab === "curly")
        for (let i = 0; i <= 6; i++) {
          const a = Math.PI * (1 + i / 6);
          ctop(circ(fx + Math.cos(a) * fr * 0.95 + o, fy + Math.sin(a) * fr * 0.95, fr * 0.42), hc);
        }
    } else {
      ctop((cc) => cc.ellipse(fx, fy - fr * 0.64, fr * 1.0, fr * 0.48, 0, 0, TAU), hc);
      if (cab === "beard") {
        ctop((cc) => cc.ellipse(fx, fy + fr * 0.7, fr * 0.82, fr * 0.42, 0, 0, TAU), hc);
        fillp((cc) => cc.ellipse(fx - fr * 0.08, fy + fr * 0.52, fr * 0.2, fr * 0.07, 0, 0, TAU), "#b8645a");
      }
    }
  };

  if (capa) {
    // cabelo atrás do casco, com contorno, para a silhueta (puffs, rabo, caracóis) se manter
    cabelo("tras", 0, -19.8, 7.2, true);
    const casco = circ(0, -19.8, 7.6);
    ct(casco, "#e8ecff");
    Es.sombra(c, casco, "#c9cde6", -1.6, -1.6);
    const visor = (cc) => cc.ellipse(-0.8, -19.7, 5.8, 5.1, 0, 0, TAU);
    ct(visor, "#1a2a4a", lw * 0.8);
    c.save();
    c.beginPath();
    visor(c);
    c.clip();
    const fx = -1.2,
      fy = -19.4,
      fr = 4.4;
    if (S.vop < 0.9) {
      cabelo("tras", fx, fy, fr, false);
      fillp(circ(fx, fy, fr), p.pele);
      olhos(fx, fy, fr);
      cabelo("frente", fx, fy, fr, false);
    }
    fillp(visor, S.viseira, S.vop);
    Es.brilho(c, -3.2, -22, 2.2, 0.9, -0.6, 0.9);
    Es.brilho(c, -4, -19.6, 0.5, 0.5, 0, 0.7);
    c.restore();
    c.beginPath();
    visor(c);
    c.strokeStyle = pal.contorno;
    c.lineWidth = lw * 0.8;
    c.stroke();
  } else {
    const fx = -0.6,
      fy = -19.6,
      fr = 6.2;
    cabelo("tras", fx, fy, fr, true);
    const cara = circ(fx, fy, fr);
    ct(cara, p.pele);
    Es.sombra(c, cara, mistura(p.pele, "#1b1633", 0.18), -1, -1);
    olhos(fx, fy, fr);
    cabelo("frente", fx, fy, fr, true);
    if (capacete) ct(circ(fx - fr * 0.95, fy + fr * 0.25, 1), "#3ee0d0", lw * 0.7);
  }
  c.restore();
}
