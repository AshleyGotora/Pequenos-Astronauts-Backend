// Complexo visto de cima (3/4), dentro e fora da base, num só mapa.
// Ideia de "nave grande onde se anda" como no Among Us, mas com planta e visual próprios.
// Mesma assinatura das outras cenas: complexo(c, t, dt, G). Não mexe no backend.
import { R, T, astro, nave, terra, cl, suave } from "./sprites.js";
import { L } from "./i18n.js";
import { POS, ESCAVAR as ESC_SRV } from "./mundo.js";

export const MW = 2800,
  MH = 1900;
const ESC = 3; // escala do astronauta (4 = tamanho da vista lateral)
const VEL = 330; // px por segundo

// ── planta ──
const FOOT = { x: 700, y: 300, w: 1320, h: 1034 }; // pegada do edifício (sólida, menos os pisos)
const BAND = 44; // parede norte vista de 3/4
const SALA = 280,
  GAP = 40;
const sx = (i) => 740 + i * (SALA + GAP);
const TOPO = { y: 380, h: 280 },
  BAIXO = { y: 960, h: 280 };
const HUB = { x: 740, y: 740, w: 1240, h: 140 };
const sala = (id, i, r, topo) => ({
  id,
  topo: !!topo,
  x: sx(i),
  y: r.y,
  w: SALA,
  h: r.h,
  cx: sx(i) + SALA / 2,
  cy: r.y + r.h / 2,
});
export const SALAS = [
  sala("radio", 0, TOPO, 1),
  sala("lab", 1, TOPO, 1),
  sala("mapa", 2, TOPO, 1),
  sala("armazem", 3, TOPO, 1),
  sala("saida", 0, BAIXO),
  sala("fato", 1, BAIXO),
  sala("energia", 2, BAIXO),
  sala("descanso", 3, BAIXO),
];
const PORTAS = SALAS.map((s) =>
  s.topo
    ? { x: s.cx - 45, y: s.y + s.h - 1, w: 90, h: HUB.y - (s.y + s.h) + 2 }
    : { x: s.cx - 45, y: HUB.y + HUB.h - 1, w: 90, h: s.y - (HUB.y + HUB.h) + 2 },
);
const SAIDA = SALAS.find((s) => s.id === "saida");
const EXIT = { x: SAIDA.cx - 45, y: SAIDA.y + SAIDA.h - 1, w: 90, h: 1340 - (SAIDA.y + SAIDA.h) + 1 };
const FLOORS = [...SALAS, HUB, ...PORTAS, EXIT];
// consolas encostadas à parede (sólidas)
const CONS = SALAS.map((s) =>
  s.id === "saida"
    ? { x: s.x + 10, y: s.y + s.h - 56, w: 80, h: 56 }
    : s.topo
      ? { x: s.cx - 70, y: s.y, w: 140, h: 56 }
      : { x: s.cx - 70, y: s.y + s.h - 56, w: 140, h: 56 },
);

// ── lá fora ──
const LOC = {
  nave: [1100, 1560],
  rocha: [320, 900],
  baliza: [2500, 820],
  cratera: [420, 1500],
  torre: [2200, 1430],
  solar: [1440, 1450],
  rover: [800, 1520],
  carga: [1300, 1620],
  habitat: [1950, 1660],
};
const ESCAVAR = [
  [2350, 520],
  [260, 420],
  [2600, 1750],
  [1650, 1760],
  [620, 160],
];
const CRAT = [
  [420, 1500, 150],
  [2300, 760, 100],
  [1500, 190, 80],
  [2560, 1500, 110],
  [180, 260, 70],
];
const DEC = [
  [560, 1100, 50, 34],
  [1900, 1500, 70, 44],
  [2400, 1200, 44, 28],
  [1250, 1800, 60, 36],
  [140, 1100, 56, 40],
  [1000, 200, 64, 40],
  [2450, 300, 50, 32],
];
const SOLID = [
  [LOC.nave[0], LOC.nave[1], 95, 34],
  [LOC.rocha[0], LOC.rocha[1], 72, 26],
  [LOC.torre[0], LOC.torre[1], 28, 14],
  ...DEC.map((d) => [d[0], d[1], d[2] * 0.5, d[3] * 0.35]),
];

// ── colisões ──
const noRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const noElip = (e, x, y) => ((x - e[0]) / e[2]) ** 2 + ((y - e[1]) / e[3]) ** 2 < 1;
function livre(x, y) {
  if (x < 20 || x > MW - 20 || y < 40 || y > MH - 20) return false;
  if (CONS.some((r) => noRect(r, x, y))) return false;
  if (SOLID.some((e) => noElip(e, x, y))) return false;
  return FLOORS.some((r) => noRect(r, x, y)) || !noRect(FOOT, x, y);
}
const cabe = (x, y) => livre(x - 16, y) && livre(x + 16, y) && livre(x, y);
const DENTRO = { x: FOOT.x, y: FOOT.y, w: FOOT.w, h: 1300 - FOOT.y };

export const nomeSala = (id) =>
  ({
    radio: L("Communications", "Comunicações"),
    lab: L("Lab", "Laboratório"),
    mapa: L("Terrain map", "Mapa do terreno"),
    armazem: L("Storage", "Armazém"),
    saida: L("Airlock (exit)", "Antecâmara (saída)"),
    fato: L("EVA suit and oxygen", "Traje e oxigénio"),
    energia: L("Power panel", "Painel de energia"),
    descanso: L("Logbook and rest", "Diário e descanso"),
  })[id];
// sala onde o jogador está (para ligar às interacções do jogo)
export const salaAtual = (G) => (G.top ? (SALAS.find((s) => noRect(s, G.top.x, G.top.y)) || {}).id || null : null);

// ── ligação ao jogo real (main.js) ──
export const estaDentro = (G) => !!G.top && noRect(DENTRO, G.top.x, G.top.y);
export const PX_M = VEL / 4; // px por metro andado (V_ANDAR = 4 m/s)
const PORTA = [SAIDA.cx, 1340];
const SOLAR_C = [LOC.solar[0] + 210, LOC.solar[1] + 85];
const SITIO = { porta: PORTA, carga: LOC.carga, energia: SOLAR_C, habitat: LOC.habitat };
// distância em "metros" do jogador a um sítio (para o HUD)
export const distA = (G, k) =>
  G.top && SITIO[k] ? Math.hypot(G.top.x - SITIO[k][0], G.top.y - SITIO[k][1]) / PX_M : null;

const RAIO = { descarregar: 140, energia: 180, habitat: 140, rocha: 130, baliza: 120, cratera: 200, cavar: 110 };
// Interacções lá fora por proximidade 2D. `m` é o x 1D que o servidor espera (backend intacto).
export function interaccoes2D(G) {
  if (!G.top || G.local === "dentro") return [];
  const e = G.vista.estado,
    J = G.jog,
    mont = e.montados || [],
    desc = e.descobertas || [],
    ev = G.eva,
    r = [];
  if (J && J.rover) return [{ id: "sairRover", m: J.m, d: 0, txt: L("Get off the rover", "Sair do rover") }];
  const junta = (id, p, m, txt, raio) => {
    const d = Math.hypot(G.top.x - p[0], G.top.y - p[1]);
    if (d <= raio) r.push({ id, m, txt, d });
  };
  const inst = e.fase === "instalacao";
  if (inst && !e.descarregada)
    junta("descarregar", LOC.carga, POS.carga, L("Unload the cargo", "Descarregar a carga"), RAIO.descarregar);
  if (inst && e.descarregada && mont.length === 0)
    junta("energia", SOLAR_C, POS.energia, L("Install the power module", "Instalar o módulo de energia"), RAIO.energia);
  if (inst && mont.length === 2)
    junta("habitat", LOC.habitat, POS.habitat, L("Assemble the habitat", "Montar o habitat"), RAIO.habitat);
  if (!ev.rocha && !desc.includes("amostra"))
    junta("rocha", LOC.rocha, POS.rocha, L("Chip a rock sample (pick)", "Tirar uma amostra da rocha (picareta)"), RAIO.rocha);
  if (!desc.includes("baliza"))
    junta("baliza", LOC.baliza, POS.baliza, L("Plant and switch on the beacon", "Fixar e ligar a baliza"), RAIO.baliza);
  if (!desc.includes("cratera"))
    junta("cratera", LOC.cratera, POS.cratera, L("Survey the depression (scanner)", "Registar a depressão (scanner)"), RAIO.cratera);
  ESCAVAR.forEach((q, i) => {
    if (!(ev.cavados && ev.cavados[i]))
      junta("cavar" + i, q, (ESC_SRV[i] || {}).m, L("Dig with the shovel", "Cavar com a pá"), RAIO.cavar);
  });
  return r.sort((a, b) => a.d - b.d);
}

// ── ajudas de desenho ──
function rr(c, x, y, w, h, r, f, s, lw = 4) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (f) {
    c.fillStyle = f;
    c.fill();
  }
  if (s) {
    c.lineWidth = lw;
    c.strokeStyle = s;
    c.stroke();
  }
}
function poli(c, p, f, s, lw = 4) {
  c.beginPath();
  c.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
  c.closePath();
  if (f) {
    c.fillStyle = f;
    c.fill();
  }
  if (s) {
    c.lineWidth = lw;
    c.strokeStyle = s;
    c.stroke();
  }
}
function elip(c, x, y, rx, ry, f, a = 1) {
  c.globalAlpha = a;
  c.fillStyle = f;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, 6.3);
  c.fill();
  c.globalAlpha = 1;
}
const hz = (i, j, s) => {
  let x = Math.imul(i * 374761393 + j * 668265263 + s * 1442695041, 1274126177);
  x ^= x >>> 15;
  return ((x >>> 0) % 10000) / 10000;
};
const paleta = (M) =>
  M
    ? { chao: "#a8522f", chao2: "#8f4426", chao3: "#bd6a42", piso: "#ecd9bd", linha: "#d6bc98", topo: "#9a5a3c", face: "#c9835c", cont: "#2a1410", fora: "#b8694f" }
    : { chao: "#8e8e9a", chao2: "#76767f", chao3: "#a4a4b0", piso: "#d3dae8", linha: "#b6bfd2", topo: "#59627f", face: "#7a86a8", cont: "#12162e", fora: "#05071a" };

// ── vento (poeira no ecrã, só em Marte) ──
const POEIRA = Array.from({ length: 140 }, () => ({
  x: Math.random() * 1280,
  y: Math.random() * 720,
  v: 0.5 + Math.random(),
  s: 2 + Math.random() * 5,
}));
function poeira(c, dt, vento, mostrar) {
  const n = Math.floor(POEIRA.length * (0.1 + 0.9 * vento) * mostrar);
  c.fillStyle = "#f2cfa0";
  POEIRA.forEach((p, i) => {
    p.x += p.v * (60 + vento * 900) * dt;
    p.y += p.v * vento * 130 * dt;
    if (p.x > 1320) {
      p.x = -40;
      p.y = Math.random() * 720;
    }
    if (p.y > 740) p.y = -20;
    if (i >= n) return;
    c.globalAlpha = (0.12 + 0.5 * vento) * mostrar;
    c.beginPath();
    c.ellipse(p.x, p.y, p.s * (1 + vento * 5), p.s * 0.45, 0.12, 0, 6.3);
    c.fill();
  });
  c.globalAlpha = 1;
}

function marca(c, x, y, nome, feito, t) {
  const cor = feito ? "#3ee0d0" : "#ffd84d",
    b = feito ? 0 : Math.sin(t * 4) * 4;
  poli(c, [x, y + 14 + b, x - 9, y + b, x, y - 14 + b, x + 9, y + b], cor, "#2a1410", 3);
  const w = nome.length * 7 + 18;
  R(c, x - w / 2, y - 48 + b, w, 20, "#0b1030", 0.85);
  T(c, x, y - 33 + b, 12, nome + (feito ? " ✓" : ""), cor, "center");
}
function rocha(c, K, M, x, y, w, h) {
  elip(c, x + w * 0.15, y + 4, w * 0.6, h * 0.22, "#000", 0.28);
  rr(c, x - w / 2, y - h, w, h, h * 0.45, M ? "#8a4326" : "#a2a2b0", K.cont, 4);
  rr(c, x - w / 2 + w * 0.12, y - h + h * 0.12, w * 0.35, h * 0.22, h * 0.12, M ? "#a85a38" : "#c4c4d0");
}
function rover(c, K, M, x, y) {
  elip(c, x, y + 4, 70, 12, "#000", 0.28);
  rr(c, x - 55, y - 62, 110, 36, 10, M ? "#f2dfc0" : "#f2f5ff", K.cont, 4);
  rr(c, x + 15, y - 56, 30, 16, 4, "#1a2a6b");
  R(c, x - 55, y - 26, 110, 6, "#9aa3c7");
  R(c, x - 58, y - 74, 20, 5, "#4a7bd1");
  [-39, 0, 39].forEach((d) => {
    elip(c, x + d, y - 10, 11, 11, "#262c52");
    elip(c, x + d, y - 10, 4, 4, "#8a93bb");
  });
}
function torre(c, K, t, x, y) {
  elip(c, x, y + 4, 40, 10, "#000", 0.28);
  poli(c, [x - 16, y, x - 4, y - 190, x + 4, y - 190, x + 16, y], "#9aa3c7", K.cont, 3);
  for (let i = 1; i < 6; i++) R(c, x - 14 + i * 2, y - i * 32, 28 - i * 4, 3, "#5a6290");
  poli(c, [x - 30, y - 196, x + 22, y - 222, x + 26, y - 210, x - 20, y - 184], "#e8ecff", K.cont, 3);
  if (Math.floor(t * 2) % 2) elip(c, x, y - 196, 5, 5, "#3ee0d0");
}

// ── o edifício ──
function predio(c, K, t, G, M, vento, mont, e, ev) {
  c.lineJoin = "round";
  rr(c, FOOT.x + 26, FOOT.y + 34, FOOT.w, FOOT.h, 44, "rgba(0,0,0,.28)");
  rr(c, FOOT.x, FOOT.y + 46, FOOT.w, FOOT.h - 46, 40, K.face, K.cont, 8);
  rr(c, FOOT.x, FOOT.y, FOOT.w, FOOT.h - 46, 40, K.topo, K.cont, 8);
  for (let x = FOOT.x + 40; x < FOOT.x + FOOT.w - 20; x += 80) elip(c, x, FOOT.y + 18, 4, 4, K.cont, 0.6);
  // paredes norte (faixa 3/4) e janelas do corredor
  [...SALAS, HUB].forEach((r) => {
    R(c, r.x, r.y - BAND, r.w, BAND, K.face);
    R(c, r.x, r.y - BAND, r.w, 5, K.cont);
    R(c, r.x, r.y - 5, r.w, 5, K.cont);
  });
  [1040, 1360, 1680].forEach((wx) => {
    rr(c, wx - 50, HUB.y - 38, 100, 26, 10, K.fora, K.cont, 4);
    if (!M) for (let i = 0; i < 5; i++) R(c, wx - 40 + i * 19, HUB.y - 33 + ((i * 7) % 16), 3, 3, "#fff");
    if (M && vento > 0.05) {
      R(c, wx - 46, HUB.y - 36, 92, 22, "#3b1a10", 0.5 * suave((vento - 0.35) / 0.65));
      for (let i = 0; i < 4; i++)
        R(c, wx - 46 + ((t * (80 + vento * 600) + i * 31) % 84), HUB.y - 34 + i * 5, 12, 2, "#f2cfa0", 0.4 + 0.5 * vento);
    }
  });
  // pisos: contorno grosso e depois o chão
  c.lineWidth = 12;
  c.strokeStyle = K.cont;
  c.fillStyle = K.cont;
  FLOORS.forEach((f) => {
    c.fillRect(f.x, f.y, f.w, f.h);
    c.strokeRect(f.x, f.y, f.w, f.h);
  });
  c.fillStyle = K.piso;
  FLOORS.forEach((f) => c.fillRect(f.x, f.y, f.w, f.h));
  c.save();
  c.beginPath();
  FLOORS.forEach((f) => c.rect(f.x, f.y, f.w, f.h));
  c.clip();
  c.strokeStyle = K.linha;
  c.lineWidth = 2;
  c.beginPath();
  for (let x = FOOT.x; x < FOOT.x + FOOT.w; x += 70) {
    c.moveTo(x, FOOT.y);
    c.lineTo(x, FOOT.y + FOOT.h);
  }
  for (let y = FOOT.y; y < FOOT.y + FOOT.h; y += 70) {
    c.moveTo(FOOT.x, y);
    c.lineTo(FOOT.x + FOOT.w, y);
  }
  c.stroke();
  c.restore();
  // linha amarela do corredor
  c.save();
  c.setLineDash([22, 18]);
  c.strokeStyle = "#ffd84d";
  c.globalAlpha = 0.55;
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(HUB.x + 20, HUB.y + HUB.h / 2);
  c.lineTo(HUB.x + HUB.w - 20, HUB.y + HUB.h / 2);
  c.stroke();
  c.restore();
  // faixas de aviso na saída
  for (let i = 0; i < 8; i++) R(c, EXIT.x + i * 11.25, 1252, 11.25, 26, i % 2 ? "#ffd84d" : "#262c52");
  R(c, EXIT.x - 12, 1248, 114, 6, "#262c52");
  R(c, EXIT.x - 12, 1254, 12, 86, "#262c52");
  R(c, EXIT.x + 90, 1254, 12, 86, "#262c52");
  R(c, EXIT.x + 30, 1246, 30, 5, "#3ee0d0");
  // mobília
  const hab = mont.includes("habitat");
  SALAS.forEach((s, i) => mobilia(c, K, s, CONS[i], t, G, M, e, ev, hab, mont));
}

function mobilia(c, K, s, k, t, G, M, e, ev, hab, mont) {
  const x = k.x,
    y = k.y,
    w = k.w,
    mx = x + w / 2;
  rr(c, x, y, w, 38, 10, "#5a6290", K.cont, 4);
  rr(c, x, y + 32, w, 24, 8, "#262c52", K.cont, 4);
  const led = (cols) => cols.forEach((q, i) => R(c, x + 12 + i * 22, y + 40, 12, 8, q));
  if (s.id === "radio") {
    const ok = mont.includes("radio");
    rr(c, mx - 56, y + 6, 112, 26, 6, ok ? "#0f2a5a" : "#141a45");
    if (ok) {
      terra(c, mx - 30, y + 19, 9);
      c.strokeStyle = "#3ee0d0";
      c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.globalAlpha = 0.9 - i * 0.25;
        c.beginPath();
        c.arc(mx - 30, y + 19, 14 + i * 6 + ((t * 14) % 6), -0.6, 0.6);
        c.stroke();
      }
      c.globalAlpha = 1;
    } else T(c, mx, y + 24, 11, L("no module", "sem módulo"), "#6a74b0", "center");
    led(ok ? ["#3ee0d0", "#ffd84d", "#e8403f", "#3ee0d0", "#ffd84d"] : ["#3b4a8f", "#3b4a8f", "#3b4a8f", "#3b4a8f", "#3b4a8f"]);
  } else if (s.id === "lab") {
    const n = (ev.rocha ? 1 : 0) + (ev.solo || 0) + (ev.gelo || 0);
    for (let i = 0; i < 5; i++) {
      rr(c, mx - 62 + i * 26, y + 4, 14, 28, 5, "rgba(207,214,245,.55)", K.cont, 2);
      if (i < Math.min(5, n))
        rr(c, mx - 60 + i * 26, y + 16, 10, 14, 3, i === 0 && ev.rocha ? "#8a5a4a" : i < (ev.gelo || 0) + (ev.rocha ? 1 : 0) ? "#8fe8ff" : M ? "#c46a40" : "#9a9aa8");
    }
    led(["#3ee0d0", "#3b4a8f", "#3ee0d0", "#3b4a8f", "#ffd84d"]);
  } else if (s.id === "mapa") {
    rr(c, mx - 56, y + 6, 112, 26, 6, "#0b1030");
    c.strokeStyle = "#3ee0d0";
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const px = mx - 52 + i * 5.2,
        py = y + 24 - 6 * Math.sin(i * 0.6 + (M ? 1 : 0)) - 4 * Math.sin(i * 0.25);
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
    R(c, mx - 3, y + 10, 6, 10, "#ffd84d");
    led(["#3ee0d0", "#3b4a8f", "#3b4a8f", "#3ee0d0", "#3b4a8f"]);
  } else if (s.id === "energia") {
    const ok = mont.includes("energia"),
      v = cl(((e.recursos && e.recursos.energia) || 0) / 100, 0, 1);
    rr(c, mx - 56, y + 6, 112, 26, 6, "#141a45");
    if (ok) R(c, mx - 50, y + 12, 100 * v, 14, v < 0.3 ? "#e8403f" : "#ffd84d");
    else T(c, mx, y + 24, 11, L("no power", "sem energia"), "#6a74b0", "center");
    led([0, 1, 2, 3, 4].map((i) => (ok && (i < 2 || Math.floor(t * 2 + i) % 2) ? "#3ee0d0" : "#3b4a8f")));
  } else if (s.id === "descanso") {
    rr(c, mx - 66, y + 6, 132, 30, 10, "#4a7bd1", K.cont, 3);
    rr(c, mx - 62, y + 10, 38, 22, 8, "#f2f5ff");
    if (hab) {
      const px = s.x + s.w - 40,
        py = s.y + 70;
      elip(c, px, py + 22, 22, 7, "#000", 0.25);
      rr(c, px - 12, py, 24, 22, 5, "#8f5a2c", K.cont, 3);
      elip(c, px, py - 6, 22, 18, "#3fa34a");
      elip(c, px, py - 12, 13, 10, "#7bc96f");
    }
  } else if (s.id === "fato") {
    R(c, x + 4, y + 18, 6, 36, "#3ee0d0");
    R(c, x + w - 10, y + 18, 6, 36, "#3ee0d0");
    c.globalAlpha = 0.95;
    astro(c, mx - 8 * ESC, y + 46 - 26 * ESC, ESC, G.cosm.char, M ? "marte" : "lua", true);
    c.globalAlpha = 1;
  } else if (s.id === "saida") {
    rr(c, x + 6, y + 8, w - 12, 22, 5, "#e8403f");
    T(c, mx, y + 24, 12, L("EXIT", "SAÍDA"), "#fff", "center");
  } else if (s.id === "armazem") {
    rr(c, x + 6, y + 10, 58, 40, 6, "#8f5a2c", K.cont, 3);
    rr(c, x + 76, y + 14, 58, 36, 6, "#a8703a", K.cont, 3);
    R(c, x + 6, y + 28, 58, 4, K.cont, 0.5);
    R(c, x + 76, y + 28, 58, 4, K.cont, 0.5);
  }
}

// ── cena ──
export function complexo(c, t, dt, G) {
  const e = G.vista.estado,
    M = e.destino === "marte",
    mont = e.montados || [],
    desc = e.descobertas || [],
    ev = G.eva,
    K = paleta(M);
  const D =
    G.top ||
    (G.top = {
      x: SAIDA.cx,
      y: G.local === "dentro" ? SAIDA.y + SAIDA.h - 90 : 1400,
      virado: false,
      anda: 0,
      aAndar: false,
      passo: 0,
      lado: 1,
      part: [],
      pegadas: [],
      fora: 1,
      cam: null,
    });
  // ── movimento (4 direcções, colisões) ──
  const k = G.tecla;
  const parado = G.bloqueado || (G.jog && G.jog.cavar > 0);
  if (G.jog && G.jog.cavar > 0) G.jog.cavar -= dt;
  let dx = parado ? 0 : (k.dir || 0) - (k.esq || 0),
    dy = parado ? 0 : (k.baixo || 0) - (k.cima || 0);
  if (dx && dy) {
    dx *= 0.7071;
    dy *= 0.7071;
  }
  if (dx || dy) {
    const nx = D.x + dx * VEL * dt,
      ny = D.y + dy * VEL * dt;
    if (cabe(nx, D.y)) D.x = nx;
    if (cabe(D.x, ny)) D.y = ny;
    if (dx) D.virado = dx < 0;
    D.anda += dt;
  }
  D.aAndar = !!(dx || dy);
  const dentro = noRect(DENTRO, D.x, D.y),
    salaId = (SALAS.find((s) => noRect(s, D.x, D.y)) || {}).id || null;
  D.fora += ((dentro ? 0 : 1) - D.fora) * Math.min(1, dt * 5);
  // ── vento: 0 = calmo, 1 = tempestade; só em Marte (na Lua não há ar) ──
  const vento = M ? (G.ventoManual != null ? G.ventoManual : G.tempestade(e) ? 1 : 0.25) : 0;
  if (window.Estilo) window.Estilo.vento = vento;
  // ── passos: poeira inclinada pelo vento (Marte) ou poeira balística + pegadas (Lua) ──
  if (D.aAndar && !dentro) {
    D.passo -= dt;
    if (D.passo <= 0) {
      D.passo = 0.28;
      D.lado = -D.lado;
      if (M) D.part.push({ tipo: "p", x: D.x, y: D.y, a: 0 });
      else {
        D.pegadas.push({ x: D.x + D.lado * 8, y: D.y });
        if (D.pegadas.length > 300) D.pegadas.shift();
        for (let i = 0; i < 4; i++) D.part.push({ tipo: "s", x: D.x, y: D.y, a: 0, vx: (Math.random() - 0.5) * 70, vy: 40 + Math.random() * 50 });
      }
    }
  }
  D.part.forEach((p) => {
    p.a += dt;
    if (p.tipo === "p") p.x += (14 + vento * 160) * dt;
  });
  D.part = D.part.filter((p) => p.a < (p.tipo === "p" ? 2 : 1.2));
  // ── câmara ──
  const ax = cl(D.x - 640, 0, MW - 1280),
    ay = cl(D.y - 380, 0, MH - 720);
  if (!D.cam) D.cam = { x: ax, y: ay };
  D.cam.x += (ax - D.cam.x) * Math.min(1, dt * 7);
  D.cam.y += (ay - D.cam.y) * Math.min(1, dt * 7);
  const cx = Math.round(D.cam.x),
    cy = Math.round(D.cam.y);

  c.save();
  c.translate(-cx, -cy);
  c.lineJoin = "round";
  // terreno
  R(c, cx - 2, cy - 2, 1284, 724, K.chao);
  for (let i = Math.floor(cx / 140); i <= (cx + 1280) / 140; i++)
    for (let j = Math.floor(cy / 140); j <= (cy + 720) / 140; j++) {
      const h = hz(i, j, 1);
      if (h > 0.6) elip(c, i * 140 + h * 90, j * 140 + hz(i, j, 3) * 100, 40 + h * 60, 14 + h * 16, K.chao2, 0.5);
      if (hz(i, j, 2) > 0.78) elip(c, i * 140 + hz(i, j, 4) * 120, j * 140 + hz(i, j, 5) * 120, 5, 3, K.chao3);
    }
  CRAT.forEach((q) => {
    elip(c, q[0], q[1], q[2], q[2] * 0.5, K.chao3);
    elip(c, q[0], q[1] + q[2] * 0.06, q[2] * 0.82, q[2] * 0.4, K.chao2);
    elip(c, q[0] + q[2] * 0.12, q[1] + q[2] * 0.1, q[2] * 0.55, q[2] * 0.22, "#000", 0.22);
  });
  if (!M) D.pegadas.forEach((q) => elip(c, q.x, q.y + 2, 7, 3, "#5a5a66", 0.55));
  // zonas planas: solar, escavações, baliza
  const [sx0, sy0] = LOC.solar;
  if (mont.includes("energia")) {
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 3; i++) {
        const px = sx0 + i * 140,
          py = sy0 + r * 100;
        poli(c, [px + 14, py, px + 134, py, px + 120, py + 70, px, py + 70], "#4a7bd1", K.cont, 4);
        poli(c, [px + 14, py, px + 134, py, px + 130, py + 14, px + 10, py + 14], "#8fb4f0");
        if (M && G.tempestade(e)) {
          c.globalAlpha = 0.5;
          poli(c, [px + 14, py, px + 134, py, px + 120, py + 70, px, py + 70], "#e8b27a");
          c.globalAlpha = 1;
        }
      }
  } else if (e.descarregada) {
    c.setLineDash([10, 8]);
    c.strokeStyle = "#ffd84d";
    c.lineWidth = 3;
    c.strokeRect(sx0, sy0, 420, 170);
    c.setLineDash([]);
    T(c, sx0 + 210, sy0 + 90, 14, L("Solar field", "Campo solar"), "#ffd84d", "center");
  }
  // local do habitat (quando só falta montá-lo)
  if (e.fase === "instalacao" && mont.length === 2) {
    c.setLineDash([10, 8]);
    c.strokeStyle = "#ffd84d";
    c.lineWidth = 3;
    c.strokeRect(LOC.habitat[0] - 100, LOC.habitat[1] - 65, 200, 130);
    c.setLineDash([]);
    T(c, LOC.habitat[0], LOC.habitat[1] + 5, 14, L("Habitat", "Habitat"), "#ffd84d", "center");
  }
  if (!e.descarregada) {
    c.setLineDash([8, 6]);
    c.strokeStyle = "#ffd84d";
    c.lineWidth = 3;
    c.strokeRect(LOC.carga[0] - 55, LOC.carga[1] - 25, 110, 50);
    c.setLineDash([]);
  }
  ESCAVAR.forEach((q, i) => {
    if (ev.cavados && ev.cavados[i]) {
      elip(c, q[0], q[1] + 5, 28, 10, K.cont, 0.7);
      poli(c, [q[0] + 26, q[1] + 4, q[0] + 44, q[1] - 12, q[0] + 64, q[1] + 4], K.chao3, K.cont, 3);
    } else {
      c.strokeStyle = "#ffd84d";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(q[0] - 12, q[1] - 8);
      c.lineTo(q[0] + 12, q[1] + 10);
      c.moveTo(q[0] + 12, q[1] - 8);
      c.lineTo(q[0] - 12, q[1] + 10);
      c.stroke();
    }
  });
  const baliza = desc.includes("baliza");
  if (!baliza) {
    c.setLineDash([6, 5]);
    c.strokeStyle = "#ffd84d";
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(LOC.baliza[0], LOC.baliza[1] + 4, 40, 12, 0, 0, 6.3);
    c.stroke();
    c.setLineDash([]);
  }
  elip(c, LOC.nave[0], LOC.nave[1] + 6, 150, 44, "#000", 0.35);

  predio(c, K, t, G, M, vento, mont, e, ev);

  // poeira dos passos
  D.part.forEach((p) => {
    if (p.tipo === "p") elip(c, p.x, p.y - 4 - p.a * 6, 6 + p.a * 14, (6 + p.a * 14) * 0.5, "#e8b27a", Math.max(0, 0.5 - p.a * 0.25));
    else {
      const oy = p.vy * p.a - 0.5 * 140 * p.a * p.a;
      elip(c, p.x + p.vx * p.a, p.y - Math.max(0, oy), 2.5, 2.5, "#cfcfda", Math.max(0, 1 - p.a / 1.2));
    }
  });

  // objectos ordenados por profundidade (y)
  const O = [];
  O.push({ y: LOC.nave[1], f: () => nave(c, LOC.nave[0], LOC.nave[1] - 46 * 3, 3, -90, 0, 1, G.cosm.nave, t) });
  if (e.descarregada && (e.carga || {}).rover) O.push({ y: LOC.rover[1], f: () => rover(c, K, M, LOC.rover[0], LOC.rover[1]) });
  if (mont.includes("radio")) O.push({ y: LOC.torre[1], f: () => torre(c, K, t, LOC.torre[0], LOC.torre[1]) });
  if (e.descarregada) {
    const cargaX = LOC.carga[0];
    [["energia", "#4a7bd1"], ["radio", "#cfd6f5"], ["habitat", "#f2f5ff"]]
      .filter((q) => !mont.includes(q[0]))
      .forEach((q, i) => O.push({ y: LOC.carga[1] + 10, f: () => rr(c, cargaX + i * 36 - 20, LOC.carga[1] - 26, 30, 30, 4, q[1], K.cont, 3) }));
  }
  DEC.forEach((d) => O.push({ y: d[1], f: () => rocha(c, K, M, d[0], d[1], d[2], d[3]) }));
  O.push({ y: LOC.rocha[1], f: () => rocha(c, K, M, LOC.rocha[0], LOC.rocha[1], 140, 96) });
  if (baliza)
    O.push({
      y: LOC.baliza[1],
      f: () => {
        R(c, LOC.baliza[0] - 3, LOC.baliza[1] - 70, 6, 70, "#9aa3c7");
        R(c, LOC.baliza[0] - 14, LOC.baliza[1] - 6, 28, 6, "#5a6290");
        elip(c, LOC.baliza[0], LOC.baliza[1] - 76, 8, 8, Math.floor(t * 2) % 2 ? "#3ee0d0" : "#0f5f58");
      },
    });
  const traje = dentro ? "cabine" : M ? "marte" : "lua";
  O.push({
    y: D.y,
    f: () => {
      elip(c, D.x + (M || dentro ? 0 : 14), D.y + 3, 22, 7, "#000", 0.3);
      astro(c, D.x - 8 * ESC, D.y - 26 * ESC, ESC, G.cosm.char, traje, !dentro, D.virado, D.aAndar ? D.anda : null);
    },
  });
  O.sort((a, b) => a.y - b.y).forEach((o) => o.f());

  // marcas dos locais de ciência
  marca(c, LOC.rocha[0], LOC.rocha[1] - 110, L("Rock", "Rocha"), ev.rocha || desc.includes("amostra"), t);
  marca(c, LOC.baliza[0], LOC.baliza[1] - 100, L("Beacon point", "Ponto da baliza"), baliza, t);
  marca(c, LOC.cratera[0], LOC.cratera[1] - 60, L("Depression", "Depressão"), desc.includes("cratera"), t);
  ESCAVAR.forEach((q, i) => {
    if (!(ev.cavados && ev.cavados[i])) T(c, q[0], q[1] - 20 + Math.sin(t * 4) * 3, 12, L("dig", "cavar"), "#ffd84d", "center");
  });
  // sala onde está: contorno a pulsar
  const sa = salaId && SALAS.find((s) => s.id === salaId);
  SALAS.forEach((s) => {
    R(c, s.cx - 80, s.y - 36, 160, 22, sa === s ? "#0f5f58" : "#262c52", 0.92);
    T(c, s.cx, s.y - 21, 11, nomeSala(s.id), sa === s ? "#fff" : "#cfd6f5", "center");
  });
  if (sa && sa.id !== "armazem") {
    c.strokeStyle = "#3ee0d0";
    c.lineWidth = 5;
    c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 5);
    c.strokeRect(sa.x + 5, sa.y + 5, sa.w - 10, sa.h - 10);
    c.globalAlpha = 1;
  }
  c.restore();

  // ── tempo: poeira a cruzar o ecrã, céu escuro, relâmpago, luzes a tremer lá dentro ──
  if (M && vento > 0.05) {
    const kk = suave((vento - 0.35) / 0.65),
      mix = 0.35 + 0.65 * D.fora;
    if (kk > 0) {
      R(c, 0, 0, 1280, 720, "#3b1a10", 0.38 * kk * mix);
      R(c, 0, 0, 1280, 720, "#b8693a", 0.22 * kk * mix);
    }
    poeira(c, dt, vento, 0.15 + 0.85 * D.fora);
  }
  if (M && G.tempestade(e)) {
    const ph = (t * 0.7) % 5;
    if (ph < 0.12) R(c, 0, 0, 1280, 720, "#fff", 0.18 * (1 - ph / 0.12));
    if (dentro && Math.sin(t * 23) + Math.sin(t * 37) > 1.4) R(c, 0, 0, 1280, 720, "#000", 0.25);
  }
  mini(c, K, D, LOC, desc);
  const nome = dentro ? (salaId ? nomeSala(salaId) : L("Base corridor", "Corredor da base")) : L("Outside", "Lá fora");
  R(c, 20, 20, 300, 34, "#0b1030", 0.85);
  T(c, 36, 43, 15, nome, "#3ee0d0", "left");
}

// minimapa no canto
function mini(c, K, D, LOC, desc) {
  const x0 = 1040,
    y0 = 16,
    k = 0.07;
  R(c, x0 - 6, y0 - 6, MW * k + 12, MH * k + 12, "#0b1030", 0.85);
  R(c, x0, y0, MW * k, MH * k, K.chao, 0.55);
  FLOORS.forEach((f) => R(c, x0 + f.x * k, y0 + f.y * k, f.w * k, f.h * k, K.piso));
  const ponto = (p, cor, r = 3) => {
    c.fillStyle = cor;
    c.beginPath();
    c.arc(x0 + p[0] * k, y0 + p[1] * k, r, 0, 6.3);
    c.fill();
  };
  ponto(LOC.nave, "#e8ecff", 4);
  ponto(LOC.rocha, desc.includes("amostra") ? "#3ee0d0" : "#ffd84d");
  ponto(LOC.baliza, desc.includes("baliza") ? "#3ee0d0" : "#ffd84d");
  ponto(LOC.cratera, desc.includes("cratera") ? "#3ee0d0" : "#ffd84d");
  ESCAVAR.forEach((q) => ponto(q, "#fff", 2));
  ponto([D.x, D.y], "#fff", 4.5);
}
