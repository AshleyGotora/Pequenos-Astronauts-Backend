// js/estilo.js — carregar ANTES de palco.js, sprites.js, mundo.js, cenas.js
(function (W) {
  let guardado = null;
  try { guardado = localStorage.getItem("la_estilo"); } catch (e) {}

  const E = {
    modo: guardado === "pixel" ? "pixel" : "suave",

    pal: {
      contorno: "#1b1633",
      sombra: "rgba(20,10,50,0.28)",
      brilho: "rgba(255,255,255,0.55)",
      vidro: "#9fd8ff",
      vidroSombra: "#5aa3d6",
      cabine: "#7e8fd6",
      voo: "#ff8a2b",
      vooSombra: "#d1631a",
      lua: "#f2f2f7",
      luaSombra: "#c9cbe0",
      luaDetalhe: "#e5483f",
      marte: "#e8cfa0",
      marteSombra: "#c4a574",
      marteDetalhe: "#2bb8b0",
    },

    larg: 3.5, // espessura do contorno (px)

    suave() { return E.modo === "suave"; },
    px() { return E.suave() ? 1 : 0.5; },

    definir(m) {
      E.modo = m === "pixel" ? "pixel" : "suave";
      try { localStorage.setItem("la_estilo", E.modo); } catch (e) {}
    },
    alternar() { E.definir(E.suave() ? "pixel" : "suave"); return E.modo; },

    // Preenche e contorna o caminho que `f(c)` desenha.
    contorno(c, f, cor, larg) {
      c.beginPath(); f(c);
      c.fillStyle = cor; c.fill();
      c.lineWidth = larg || E.larg;
      c.lineJoin = "round"; c.lineCap = "round";
      c.strokeStyle = E.pal.contorno; c.stroke();
    },

    // Sombra de um só tom (meia-lua) dentro da forma, no lado oposto a (dx,dy).
    sombra(c, f, cor, dx, dy) {
      dx = dx == null ? -3 : dx; dy = dy == null ? -3 : dy;
      c.save();
      c.beginPath(); f(c); c.clip();
      c.beginPath();
      c.rect(-9999, -9999, 19998, 19998);
      c.translate(dx, dy); f(c); c.translate(-dx, -dy);
      c.fillStyle = cor || E.pal.sombra;
      c.fill("evenodd");
      c.restore();
    },

    // Reflexo (elipse clara inclinada).
    brilho(c, x, y, w, h, rot, a) {
      c.save();
      c.globalAlpha = a == null ? 1 : a;
      c.fillStyle = E.pal.brilho;
      c.beginPath();
      c.ellipse(x, y, w, h, rot || -0.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    },

    // Rectângulo arredondado como caminho.
    rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    },
  };

  W.Estilo = E;
  Object.defineProperty(W, "ESTILO", { get() { return E.modo; }, configurable: true });
})(window);