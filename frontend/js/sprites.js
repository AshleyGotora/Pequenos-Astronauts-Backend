// Pixel art desenhada em canvas: astronautas, trajes, naves e planetas (design da Fase 1).
import { NAVES } from "./naves.js";
import { astroSuave } from "./astrosuave.js";

export const PERSONAGENS = {
  amelia: {
    nome: "Amélia",
    papel: "Engenheira",
    cabelo: "puffs",
    pele: "#8a5a3c",
  },
  nyeleti: {
    nome: "Nyeleti",
    papel: "Comandante",
    cabelo: "pony",
    pele: "#c9946a",
  },
  tomas: {
    nome: "Tomás",
    papel: "Médico de bordo",
    cabelo: "curly",
    pele: "#5c3a24",
  },
  kito: { nome: "Kito", papel: "Piloto", cabelo: "beard", pele: "#e0b08a" },
};
export const TRAJES = {
  cabine: {
    c: "#4a7bd1",
    a: "#ffd84d",
    luva: null,
    bota: "#e8ecff",
    viseira: null,
    vop: 0,
  },
  voo: {
    c: "#ff8a3d",
    a: "#4a7bd1",
    luva: "#1a1a2e",
    bota: "#1a1a2e",
    viseira: "#8fe8ff",
    vop: 0.3,
  },
  lua: {
    c: "#f2f5ff",
    a: "#e8403f",
    luva: "#9aa3c7",
    bota: "#9aa3c7",
    viseira: "#f5b942",
    vop: 0.95,
  },
  marte: {
    c: "#f2dfc0",
    a: "#2ec4b6",
    luva: "#8a4326",
    bota: "#8a4326",
    viseira: "#3ee0d0",
    vop: 0.4,
  },
};
export const INFO_NAVES = {
  aurora: { nome: "Aurora", linha: "Foguetão clássico · equilibrada" },
  baoba: { nome: "Embondeiro", linha: "Cargueiro · casco largo" },
  impala: { nome: "Impala", linha: "Avião espacial · afilada" },
  ubuntu: { nome: "Ubuntu", linha: "Modular · cooperação" },
};

// Com o palco Phaser (c.__px definido) os rectângulos são encaixados na grelha de pixels do ecrã,
// para os cantos ficarem nítidos (pixel art) em vez de desfocados.
function rectPixel(c, x, y, w, h) {
  const m = c.getTransform();
  if (m.b || m.c) return c.fillRect(x, y, w, h);
  const a = m.a * x + m.e,
    b = m.a * (x + w) + m.e,
    d = m.d * y + m.f,
    e = m.d * (y + h) + m.f;
  const l = Math.round(Math.min(a, b)),
    t = Math.round(Math.min(d, e));
  let r = Math.round(Math.max(a, b)),
    u = Math.round(Math.max(d, e));
  if (r === l) r = l + 1;
  if (u === t) u = t + 1;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillRect(l, t, r - l, u - t);
  c.restore();
}
export function R(c, x, y, w, h, f, o = 1) {
  c.globalAlpha = o;
  c.fillStyle = f;
  if (c.__px) rectPixel(c, x, y, w, h);
  else c.fillRect(x, y, w, h);
  c.globalAlpha = 1;
}
export function P(c, pts, f, o = 1) {
  c.globalAlpha = o;
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
}
export function C(c, x, y, r, f, o = 1) {
  c.globalAlpha = o;
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, r, 0, 6.2832);
  c.fill();
  c.globalAlpha = 1;
}
export function T(
  c,
  x,
  y,
  s,
  t,
  f = "#e8ecff",
  a = "left",
  px = false,
  w = 600,
) {
  // No palco Phaser o mundo é desenhado a meia resolução (pixelado); o texto vai para uma
  // camada à parte em resolução total (c.__tx), com a mesma transformação, para continuar legível.
  let g = c;
  if (c.__tx) {
    const m = c.getTransform(),
      k = 1 / c.__px;
    g = c.__tx;
    g.setTransform(m.a * k, m.b * k, m.c * k, m.d * k, m.e * k, m.f * k);
    g.globalAlpha = c.globalAlpha;
  }
  g.font = `${w} ${s}px ${px ? "'Pixelify Sans'" : "Inter"}, sans-serif`;
  g.textAlign = a;
  g.fillStyle = f;
  g.fillText(t, x, y);
}
export function rng(s) {
  return () => {
    s =
      Math.imul(s ^ (s >>> 15), 2246822507) ^
      Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}

// Astronauta de 16×27 px. (x, y) é o canto superior esquerdo; s é a escala.
export function astro(
  c,
  x,
  y,
  s,
  quem,
  traje,
  capacete,
  virado = false,
  anda = null,
) {
  if (window.Estilo && Estilo.suave())
    return astroSuave(c, x, y, s, quem, traje, capacete, virado, anda);
  const p = PERSONAGENS[quem] || PERSONAGENS.amelia,
    S = TRAJES[traje] || TRAJES.cabine,
    K = "#262c52";
  const pele = p.pele,
    col = S.c,
    a = S.a,
    gordo = traje === "lua";
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (virado) {
    c.translate(16, 0);
    c.scale(-1, 1);
  }
  c.translate(0, 2 + (anda != null && Math.floor(anda * 7) % 2 ? 0.4 : 0));
  const r = (X, Y, W, H, F, O) => R(c, X, Y, W, H, F, O);
  if (gordo) r(1, 6, 14, 10, "#9aa3c7");
  if (traje === "marte") {
    r(12, 6, 2, 3, "#9aa3c7");
    r(13, 0, 1, 7, "#9aa3c7");
    r(13, -1, 1, 1, "#e8403f");
  }
  // pernas e braços: quando anda, alternam (4 poses por ciclo)
  const pose = anda == null ? 1 : Math.floor(anda * 7) % 4,
    pa = pose === 0 ? 1 : 0,
    pb = pose === 2 ? 1 : 0;
  const perna = (x, sobe, sombra) => {
    c.save();
    c.translate(
      sobe ? 0.8 : anda != null && pose % 2 === 0 ? -0.5 : 0,
      sobe ? -1.2 : 0,
    );
    if (gordo) r(x - 2 + (x > 6 ? 2 : 0), 21, 5, 3, S.bota);
    else r(x - 1 + (x > 6 ? 1 : 0), 22, 4, 2, S.bota);
    r(x, 16, 3, 6, col);
    if (sombra) r(x + 2, 16, 1, 6, "#000", 0.14);
    if (traje === "marte") {
      r(x, 19, 3, 3, S.bota);
      r(x, 18, 3, 1, a);
    } else if (traje === "voo") r(x + (x > 6 ? 1 : 0), 17, 2, 2, "#000", 0.18);
    else if (traje === "lua") r(x, 18, 3, 1, a);
    c.restore();
  };
  perna(5, pa, false);
  perna(8, pb, true);
  r(7.75, 17, 0.5, 4, "#000", 0.25);
  r(4, 8, 8, 8, col);
  r(11, 8, 1, 8, "#000", 0.14);
  const ax = gordo ? 1 : 2,
    aw = gordo ? 3 : 2,
    g = S.luva || pele;
  const braco = (x, dy) => {
    r(x, 9 + dy, aw, 6, col);
    r(x, 12 + dy, aw, 1, a);
    r(x, 15 + dy, aw, 2, g);
  };
  braco(ax, pb ? -1 : 0);
  braco(12, pa ? -1 : 0);
  r(4, 15, 8, 1, K);
  if (traje === "cabine") {
    r(7.75, 9, 0.5, 6, "#000", 0.3);
    r(6, 8, 4, 1, a);
    r(9, 10, 2, 2, a);
    r(5, 10, 2, 1, "#fff");
  }
  if (traje === "voo") {
    r(5, 8, 6, 1, "#8a93bb");
    r(6, 10, 4, 3, K);
    r(6, 10, 1, 1, "#4a7bd1");
    r(9, 10, 1, 1, "#e8403f");
    r(7, 12, 2, 1, "#ffd84d");
    r(5, 13, 1, 2, "#8a93bb");
    r(12, 10, 2, 1, "#fff");
  }
  if (traje === "lua") {
    r(5, 8, 6, 1, "#9aa3c7");
    r(5, 10, 6, 4, "#cfd6f5");
    r(6, 11, 1, 1, "#e8403f");
    r(8, 11, 1, 1, "#ffd84d");
    r(6, 12, 4, 1, K);
  }
  if (traje === "marte") {
    r(4, 8, 8, 1, "#8a4326");
    r(6, 10, 4, 2, a);
    r(6, 10, 1, 1, "#fff");
    r(5, 13, 6, 1, "#8a4326", 0.6);
  }
  const olhos = () => {
    r(6, 4, 1, 1, "#1a1a2e");
    r(9, 4, 1, 1, "#1a1a2e");
  };
  if (!(capacete && traje !== "cabine")) {
    r(4, 4, 1, 2, pele);
    r(11, 4, 1, 2, pele);
    r(5, 2, 6, 6, pele);
    olhos();
    r(7, 6, 2, 1, "#000", 0.3);
    const h = p.cabelo,
      m = (l, f) => l.forEach((q) => r(q[0], q[1], q[2], q[3], f));
    if (h === "puffs")
      m(
        [
          [3, -1, 3, 3],
          [10, -1, 3, 3],
          [5, 1, 6, 2],
          [4, 2, 1, 3],
          [11, 2, 1, 3],
        ],
        "#1c1410",
      );
    if (h === "pony") {
      m(
        [
          [5, 1, 6, 2],
          [4, 2, 1, 3],
          [11, 2, 1, 3],
          [12, 2, 2, 1],
          [13, 3, 1, 5],
          [12, 7, 1, 1],
        ],
        "#4a2a14",
      );
      r(11, 2, 2, 1, "#ffd84d");
    }
    if (h === "curly") {
      m(
        [
          [4, -1, 8, 4],
          [3, 0, 1, 4],
          [12, 0, 1, 4],
        ],
        "#1c1410",
      );
      m(
        [
          [5, 3.6, 2.4, 0.4],
          [5, 5.6, 2.4, 0.4],
          [5, 3.6, 0.4, 2.4],
          [7, 3.6, 0.4, 2.4],
          [8.6, 3.6, 2.4, 0.4],
          [8.6, 5.6, 2.4, 0.4],
          [8.6, 3.6, 0.4, 2.4],
          [10.6, 3.6, 0.4, 2.4],
        ],
        "#e8ecff",
      );
    }
    if (h === "beard") {
      m(
        [
          [5, 1, 6, 2],
          [4, 2, 1, 2],
          [11, 2, 1, 2],
          [5, 6, 6, 2],
        ],
        "#2b1a10",
      );
      r(7, 6, 2, 1, "#7a3b2e");
    }
    if (capacete) {
      r(3, 3, 1, 3, K);
      r(3, 6, 3, 1, K);
      r(5, 6, 1, 1, "#3ee0d0");
    }
  } else {
    r(4, -1, 8, 1, "#e8ecff");
    r(3, 0, 10, 8, "#e8ecff");
    r(12, 0, 1, 8, "#000", 0.16);
    r(4, 1, 8, 6, "#1a2a4a");
    if (S.vop < 0.9) {
      r(5, 2, 6, 5, pele);
      olhos();
    }
    r(4, 1, 8, 6, S.viseira, S.vop);
    r(5, 2, 2, 1, "#fff", 0.8);
    r(4, 8, 8, 1, a);
  }
  c.restore();
}

function forma(c, e, cor) {
  const f = e[e.length - 2] === "AC" ? cor : e[e.length - 2],
    o = e[e.length - 1];
  if (e[0] === "p") P(c, e[1], f, o);
  else if (e[0] === "r") R(c, e[1], e[2], e[3], e[4], f, o);
  else C(c, e[1], e[2], e[3], f, o);
}
// Nave em pixel (modo "pixel"): (cx, cy) é o centro; ang = 0 deitada com o nariz para a direita, −90 de pé.
function navePixel(
  c,
  cx,
  cy,
  sc,
  ang,
  chama,
  pernas,
  modelo = "aurora",
  t = 0,
) {
  const n = NAVES[modelo] || NAVES.aurora;
  c.save();
  c.translate(cx, cy);
  c.rotate((ang * Math.PI) / 180);
  c.scale(sc, sc);
  c.translate(-36, -20);
  if (pernas > 0) {
    c.save();
    c.translate(18, 20);
    c.scale(pernas, pernas);
    c.translate(-18, -20);
    P(c, [18, 12, -8, 0, -8, 4, 14, 16], "#8a93bb");
    P(c, [18, 28, -8, 40, -8, 36, 14, 24], "#8a93bb");
    R(c, -10, -3, 2, 9, "#5a6290");
    R(c, -10, 34, 2, 9, "#5a6290");
    c.restore();
  }
  if (chama > 0) {
    c.save();
    c.translate(6, 20);
    c.scale(chama * (1 + 0.18 * Math.sin(t * 45)), 1);
    c.translate(-6, -20);
    n.chama.forEach((e) => forma(c, e, n.cor));
    c.restore();
  }
  n.corpo.forEach((e) => forma(c, e, n.cor));
  c.restore();
}

// Nave em vector (modo "suave"). Mesma assinatura. Nariz para a direita, caixa de 72×40.
export function nave(
  c,
  cx,
  cy,
  sc,
  ang,
  chama,
  pernas,
  modelo = "aurora",
  t = 0,
) {
  if (!(window.Estilo && Estilo.suave()))
    return navePixel(c, cx, cy, sc, ang, chama, pernas, modelo, t);
  const n = NAVES[modelo] || NAVES.aurora,
    AC = typeof n.cor === "string" ? n.cor : "#e8403f",
    K = "#0b1030",
    B1 = "#f4f7ff",
    B2 = "#b9c3e6",
    B3 = "#7f8ab8";
  c.save();
  c.translate(cx, cy);
  c.rotate((ang * Math.PI) / 180);
  c.scale(sc, sc);
  c.translate(-36, -20);
  c.lineJoin = c.lineCap = "round";
  c.strokeStyle = K;
  c.lineWidth = 1.2;

  const vg = (y0, y1, a, b) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
  };
  const fp = (f) => {
    c.fillStyle = f;
    c.fill();
    c.stroke();
  };
  const poly = (pts, f) => {
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    fp(f);
  };
  const jan = (x, y, r) => {
    c.beginPath();
    c.arc(x, y, r, 0, 6.2832);
    fp(vg(y - r, y + r, "#7fe6f5", "#16204a"));
    c.beginPath();
    c.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, 6.2832);
    c.fillStyle = "rgba(255,255,255,.85)";
    c.fill();
  };
  // casco: contorno + gradiente + nariz/bandas na cor do modelo + brilho e sombra
  const casco = (cam, g, nx, bandas, top, bot) => {
    cam();
    fp(g);
    c.save();
    cam();
    c.clip();
    c.fillStyle = AC;
    c.fillRect(nx, -4, 90, 48);
    bandas.forEach((b) => c.fillRect(b[0], -4, b[1], 48));
    c.fillStyle = "rgba(255,255,255,.5)";
    c.fillRect(-4, top + 1.6, 90, 1.6);
    c.fillStyle = "rgba(0,0,0,.14)";
    c.fillRect(-4, bot - 5, 90, 8);
    c.restore();
    cam();
    c.stroke();
  };

  // pernas
  if (pernas > 0) {
    c.save();
    c.translate(18, 20);
    c.scale(pernas, pernas);
    c.translate(-18, -20);
    [
      [16, 12, -6, 3],
      [16, 28, -6, 37],
    ].forEach((l) => {
      c.lineWidth = 4;
      c.strokeStyle = K;
      c.beginPath();
      c.moveTo(l[0], l[1]);
      c.lineTo(l[2], l[3]);
      c.stroke();
      c.lineWidth = 2.2;
      c.strokeStyle = B3;
      c.beginPath();
      c.moveTo(l[0], l[1]);
      c.lineTo(l[2], l[3]);
      c.stroke();
      c.lineWidth = 1.2;
      c.strokeStyle = K;
      rr(c, l[2] - 5, l[3] - 1.4, 9, 2.8, 1.4);
      fp(B2);
    });
    c.restore();
  }
  // chama
  if (chama > 0) {
    c.save();
    c.translate(6, 20);
    c.scale(chama * (1 + 0.18 * Math.sin(t * 45)), 1);
    const fl = (len, h, col) => {
      c.beginPath();
      c.moveTo(0, -h);
      c.quadraticCurveTo(-len * 0.6, -h * 0.8, -len, 0);
      c.quadraticCurveTo(-len * 0.6, h * 0.8, 0, h);
      c.closePath();
      c.fillStyle = col;
      c.fill();
    };
    fl(32, 6.5, "#ff7a2d");
    fl(22, 4.4, "#ffd84d");
    fl(12, 2.4, "#fff6d0");
    c.restore();
  }

  if (modelo === "baoba") {
    poly([22, 7, 12, -1, 8, 7], AC);
    poly([22, 33, 12, 41, 8, 33], AC);
    rr(c, 1, 14, 7, 12, 2.5);
    fp(B3);
    casco(
      () => {
        c.beginPath();
        c.moveTo(16, 5);
        c.lineTo(50, 5);
        c.bezierCurveTo(64, 5, 72, 12, 72, 20);
        c.bezierCurveTo(72, 28, 64, 35, 50, 35);
        c.lineTo(16, 35);
        c.quadraticCurveTo(6, 35, 6, 25);
        c.lineTo(6, 15);
        c.quadraticCurveTo(6, 5, 16, 5);
        c.closePath();
      },
      vg(5, 35, B1, B2),
      60,
      [[10, 3]],
      5,
      35,
    );
    c.lineWidth = 1;
    rr(c, 22, 12, 18, 16, 3);
    c.stroke();
    c.beginPath();
    c.moveTo(31, 12);
    c.lineTo(31, 28);
    c.stroke();
    jan(54, 19, 4.6);
  } else if (modelo === "impala") {
    poly([46, 14, 22, -3, 12, -3, 26, 14], AC);
    poly([46, 26, 22, 43, 12, 43, 26, 26], AC);
    poly([12, 14, 4, 6, 2, 14], AC);
    poly([12, 26, 4, 34, 2, 26], AC);
    rr(c, 1, 16.5, 6, 7, 2);
    fp(B3);
    casco(
      () => {
        c.beginPath();
        c.moveTo(7, 14);
        c.lineTo(40, 14);
        c.bezierCurveTo(56, 14, 68, 18, 73, 20);
        c.bezierCurveTo(68, 22, 56, 26, 40, 26);
        c.lineTo(7, 26);
        c.quadraticCurveTo(4, 26, 4, 23);
        c.lineTo(4, 17);
        c.quadraticCurveTo(4, 14, 7, 14);
        c.closePath();
      },
      vg(14, 26, B1, B2),
      62,
      [[10, 2]],
      14,
      26,
    );
    c.beginPath();
    c.ellipse(50, 19.3, 5, 3, 0, 0, 6.2832);
    fp(vg(16, 22, "#7fe6f5", "#16204a"));
  } else if (modelo === "ubuntu") {
    poly([10, 11, 2, 2, 5, 11], AC);
    poly([10, 29, 2, 38, 5, 29], AC);
    c.lineWidth = 1.2;
    [
      [21, 16, 6, 8],
      [45, 16, 6, 8],
    ].forEach((b) => {
      rr(c, b[0], b[1], b[2], b[3], 2);
      fp(B3);
    });
    // casulos laterais do módulo do meio
    c.beginPath();
    c.ellipse(35, 6, 8, 3.2, 0, 0, 6.2832);
    fp(AC);
    c.beginPath();
    c.ellipse(35, 34, 8, 3.2, 0, 0, 6.2832);
    fp(AC);
    casco(
      () => rr(c, 4, 10, 18, 20, 5),
      vg(10, 30, B1, B2),
      200,
      [],
      10,
      30,
    );
    casco(
      () => rr(c, 25, 8, 21, 24, 6),
      vg(8, 32, B1, B2),
      200,
      [[33, 5]],
      8,
      32,
    );
    casco(
      () => {
        c.beginPath();
        c.moveTo(50, 11);
        c.lineTo(58, 11);
        c.bezierCurveTo(66, 11, 72, 16, 72, 20);
        c.bezierCurveTo(72, 24, 66, 29, 58, 29);
        c.lineTo(50, 29);
        c.closePath();
      },
      vg(11, 29, B1, B2),
      60,
      [],
      11,
      29,
    );
    jan(13, 20, 3.6);
    jan(35.5, 20, 4);
    jan(55, 20, 3.4);
  } else {
    // aurora (foguetão clássico) e qualquer modelo desconhecido
    poly([24, 11, 6, -2, 4, 11], AC);
    poly([24, 29, 6, 42, 4, 29], AC);
    rr(c, 1.5, 15, 6.5, 10, 2.5);
    fp(B3);
    casco(
      () => {
        c.beginPath();
        c.moveTo(8, 11);
        c.lineTo(44, 11);
        c.bezierCurveTo(58, 11, 68, 16, 72, 20);
        c.bezierCurveTo(68, 24, 58, 29, 44, 29);
        c.lineTo(8, 29);
        c.quadraticCurveTo(5, 29, 5, 26);
        c.lineTo(5, 14);
        c.quadraticCurveTo(5, 11, 8, 11);
        c.closePath();
      },
      vg(11, 29, B1, B2),
      54,
      [[12, 4]],
      11,
      29,
    );
    jan(40, 20, 5);
  }
  c.restore();
}

function terraPixel(c, x, y, r) {
  C(c, x, y, r * 1.07, "#8fc2ff", 0.22);
  C(c, x, y, r, "#4a7bd1");
  C(c, x - r * 0.3, y - r * 0.25, r * 0.34, "#7bc96f");
  C(c, x + r * 0.35, y + r * 0.3, r * 0.22, "#7bc96f");
  C(c, x + r * 0.25, y - r * 0.45, r * 0.18, "#e8ecff", 0.85);
}

// Terra em vector (modo "suave"): atmosfera, oceano com gradiente, continentes,
// nuvens, calotes polares e sombra de noite (luz vinda de cima à esquerda).
export function terra(c, x, y, r) {
  if (!(window.Estilo && Estilo.suave())) return terraPixel(c, x, y, r);
  const rad = (cx, cy, r0, r1, stops) => {
    const g = c.createRadialGradient(cx, cy, r0, cx, cy, r1);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    return g;
  };
  // contorno suave a passar pelos pontos (coordenadas em unidades de raio)
  const blob = (pts) => {
    const n = pts.length,
      m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      s = m(pts[n - 1], pts[0]);
    c.beginPath();
    c.moveTo(x + s[0] * r, y + s[1] * r);
    for (let i = 0; i < n; i++) {
      const p = pts[i],
        e = m(p, pts[(i + 1) % n]);
      c.quadraticCurveTo(
        x + p[0] * r,
        y + p[1] * r,
        x + e[0] * r,
        y + e[1] * r,
      );
    }
    c.closePath();
  };
  c.save();
  // atmosfera
  c.fillStyle = rad(x, y, r * 0.96, r * 1.16, [
    [0, "rgba(143,194,255,.55)"],
    [1, "rgba(143,194,255,0)"],
  ]);
  c.beginPath();
  c.arc(x, y, r * 1.16, 0, 6.2832);
  c.fill();
  // tudo o resto fica dentro do círculo
  c.beginPath();
  c.arc(x, y, r, 0, 6.2832);
  c.clip();
  // oceano
  c.fillStyle = rad(x - r * 0.35, y - r * 0.35, r * 0.05, r * 1.25, [
    [0, "#6fb4ff"],
    [0.55, "#3a76d6"],
    [1, "#1b3f96"],
  ]);
  c.fillRect(x - r, y - r, r * 2, r * 2);
  // continentes
  c.lineJoin = "round";
  c.lineWidth = Math.max(0.5, r * 0.014);
  c.strokeStyle = "rgba(30,90,50,.55)";
  [
    [
      [-0.62, -0.3],
      [-0.35, -0.62],
      [-0.05, -0.5],
      [0.05, -0.25],
      [-0.15, -0.05],
      [-0.25, 0.2],
      [-0.42, 0.12],
      [-0.58, -0.05],
    ],
    [
      [0.25, 0.05],
      [0.55, -0.1],
      [0.74, 0.15],
      [0.56, 0.46],
      [0.3, 0.56],
      [0.18, 0.3],
    ],
    [
      [-0.2, 0.55],
      [0, 0.5],
      [0.06, 0.7],
      [-0.14, 0.78],
    ],
  ].forEach((pts) => {
    blob(pts);
    c.fillStyle = rad(x - r * 0.3, y - r * 0.3, r * 0.1, r * 1.1, [
      [0, "#9be07a"],
      [1, "#4f9d4a"],
    ]);
    c.fill();
    c.stroke();
  });
  // calotes polares
  c.fillStyle = "rgba(245,250,255,.9)";
  c.beginPath();
  c.ellipse(x, y - r * 0.97, r * 0.42, r * 0.14, 0, 0, 6.2832);
  c.fill();
  c.beginPath();
  c.ellipse(x, y + r * 0.98, r * 0.34, r * 0.1, 0, 0, 6.2832);
  c.fill();
  // nuvens
  c.fillStyle = "rgba(255,255,255,.78)";
  [
    [-0.28, -0.12, 0.3, 0.06, -0.2],
    [0.22, 0.22, 0.26, 0.05, 0.15],
    [-0.5, 0.35, 0.2, 0.045, 0.1],
    [0.3, -0.38, 0.24, 0.05, -0.1],
    [0.0, 0.05, 0.16, 0.035, 0.05],
  ].forEach((q) => {
    c.beginPath();
    c.ellipse(x + q[0] * r, y + q[1] * r, q[2] * r, q[3] * r, q[4], 0, 6.2832);
    c.fill();
  });
  // luz de atmosfera na borda
  c.fillStyle = rad(x, y, r * 0.82, r, [
    [0, "rgba(140,200,255,0)"],
    [1, "rgba(140,200,255,.4)"],
  ]);
  c.fillRect(x - r, y - r, r * 2, r * 2);
  // lado da noite
  c.fillStyle = rad(x - r * 0.4, y - r * 0.4, r * 0.55, r * 1.45, [
    [0, "rgba(4,8,36,0)"],
    [0.6, "rgba(4,8,36,.3)"],
    [1, "rgba(4,8,36,.72)"],
  ]);
  c.fillRect(x - r, y - r, r * 2, r * 2);
  // brilho
  c.fillStyle = rad(x - r * 0.45, y - r * 0.5, 0, r * 0.28, [
    [0, "rgba(255,255,255,.4)"],
    [1, "rgba(255,255,255,0)"],
  ]);
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}
export function lua(c, x, y, r) {
  C(c, x, y, r, "#c9c9d6");
  C(c, x - r * 0.3, y - r * 0.3, r * 0.26, "#9a9ab0");
  C(c, x + r * 0.35, y + r * 0.3, r * 0.18, "#9a9ab0");
  C(c, x + r * 0.2, y - r * 0.45, r * 0.1, "#9a9ab0");
}
export function marte(c, x, y, r) {
  C(c, x, y, r * 1.06, "#ffb78a", 0.25);
  C(c, x, y, r, "#c97b58");
  C(c, x - r * 0.25, y - r * 0.3, r * 0.3, "#e0a070");
  C(c, x + r * 0.3, y + r * 0.25, r * 0.25, "#a8522f");
  C(c, x - r * 0.1, y + r * 0.55, r * 0.14, "#8a4326");
  C(c, x, y - r * 0.88, r * 0.14, "#f2f5ff", 0.9);
}
export const planeta = (c, d, x, y, r) =>
  (d === "marte" ? marte : lua)(c, x, y, r);

const r0 = rng(7);
const ESTRELAS = [...Array(160)].map(() => [
  r0() * 1280,
  r0() * 720,
  r0() < 0.2 ? 4 : 3,
  0.4 + r0() * 0.6,
]);
export function estrelas(c, op = 1, dy = 0, maxy = 720) {
  ESTRELAS.forEach((s) => {
    if (s[1] < maxy)
      R(c, s[0], (s[1] + dy) % 720, s[2], s[2], "#fff", s[3] * op);
  });
}
export function mistura(a, b, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)),
    A = p(a),
    B = p(b);
  return (
    "#" +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * k)
        .toString(16)
        .padStart(2, "0"),
    ).join("")
  );
}
export const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const suave = (v) => {
  v = cl(v);
  return v * v * (3 - 2 * v);
};

// ───────────── Nia, a guia robô (16×16 px, desenhada em canvas) ─────────────
const ROBO = [
  "......oyyo......",
  ".......oo.......",
  "..oooooooooooo..",
  ".oggggggggggggo.",
  ".ogoooooooooogo.",
  ".ogovvvvvvvvogo.",
  ".ogovccvvccvogo.",
  ".ogovccvvccvogo.",
  ".ogovvvvvvvvogo.",
  ".oggggggggggggo.",
  "..oooooooooooo..",
  "...oggggggggo...",
  "...ogrgggbggo...",
  "...oggggggggo...",
  "..ooo......ooo..",
  "..ooo......ooo..",
];
const ROBO_COR = {
  o: "#0b1030",
  g: "#c3cde0",
  v: "#16204a",
  c: "#5ad6e8",
  y: "#ffd84d",
  r: "#ff7a85",
  b: "#4a7bd1",
};
// (x, y) é o canto superior esquerdo; s é a escala; pisca fecha os olhos.
// Nia em pixel (modo "pixel")
function roboPixel(c, x, y, s, pisca = false) {
  ROBO.forEach((linha, j) => {
    for (let i = 0; i < linha.length; i++) {
      let k = linha[i];
      if (k === ".") continue;
      if (pisca && k === "c") k = "v";
      R(c, x + i * s, y + j * s, s, s, ROBO_COR[k]);
    }
  });
}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// Nia em vector. Mesma área da versão pixel: 16×16 unidades, canto superior esquerdo (x, y).
export function robo(c, x, y, s, pisca = false) {
  if (!(window.Estilo && Estilo.suave())) return roboPixel(c, x, y, s, pisca);
  const K = "#0b1030",
    G = "#c3cde0",
    V = "#16204a",
    CI = "#5ad6e8";
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = c.lineCap = "round";
  c.lineWidth = 0.8;
  c.strokeStyle = K;
  const forma = (fx, fy, w, h, r, cor) => {
    rr(c, fx, fy, w, h, r);
    c.fillStyle = cor;
    c.fill();
    c.stroke();
  };
  // antena
  c.beginPath();
  c.moveTo(8, 3);
  c.lineTo(8, 1.4);
  c.stroke();
  c.beginPath();
  c.arc(8, 1.1, 1, 0, 6.2832);
  c.fillStyle = "#ffd84d";
  c.fill();
  c.stroke();
  // pés e corpo
  forma(3.6, 14.2, 3.2, 1.5, 0.75, G);
  forma(9.2, 14.2, 3.2, 1.5, 0.75, G);
  forma(4.2, 10.6, 7.6, 4.2, 1.8, G);
  c.beginPath();
  c.arc(6.4, 12.7, 0.55, 0, 6.2832);
  c.fillStyle = "#ff7a85";
  c.fill();
  c.beginPath();
  c.arc(9.4, 12.7, 0.55, 0, 6.2832);
  c.fillStyle = "#4a7bd1";
  c.fill();
  // orelhas e cabeça
  forma(0.9, 4.8, 1.6, 3.4, 0.8, G);
  forma(13.5, 4.8, 1.6, 3.4, 0.8, G);
  forma(1.7, 2.8, 12.6, 8.2, 3.4, G);
  // brilho no topo da cabeça
  c.beginPath();
  c.moveTo(4.4, 3.9);
  c.lineTo(8.6, 3.9);
  c.strokeStyle = "rgba(255,255,255,.75)";
  c.lineWidth = 0.55;
  c.stroke();
  // viseira
  c.strokeStyle = K;
  c.lineWidth = 0.8;
  forma(3.2, 4.4, 9.6, 5.2, 2.3, V);
  // olhos a brilhar
  c.shadowColor = CI;
  c.shadowBlur = s * 1.4;
  c.fillStyle = CI;
  c.strokeStyle = CI;
  [5.9, 10.1].forEach((ex) => {
    if (pisca) {
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(ex - 1, 7);
      c.lineTo(ex + 1, 7);
      c.stroke();
    } else {
      c.beginPath();
      c.ellipse(ex, 7, 1.05, 1.4, 0, 0, 6.2832);
      c.fill();
    }
  });
  c.shadowBlur = 0;
  c.shadowColor = "transparent";
  if (!pisca) {
    c.fillStyle = "#fff";
    [5.55, 9.75].forEach((ex) => {
      c.beginPath();
      c.arc(ex, 6.4, 0.3, 0, 6.2832);
      c.fill();
    });
  }
  c.restore();
}