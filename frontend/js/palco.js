// O palco Phaser: é ele que manda no ecrã. Cria o jogo em cima do <canvas id="cv"> e, a cada
// quadro, chama o ciclo de desenho do jogo (main.js) com o contexto 2D de uma textura.
//
//  • "mundo": textura onde o jogo desenha tudo (naves, planetas, terreno, astronauta).
//      - modo pixel: 640×360 (PX = 0.5), ampliada 2× com NEAREST (aspecto pixel art)
//      - modo suave: 1280×720 (PX = 1), resolução total, filtro LINEAR
//  • "texto": textura de 1280×720 por cima, só com o texto, para as letras ficarem legíveis.
//
// As funções de desenho (sprites.js, cenas.js, mundo.js) não mudam: continuam a usar coordenadas
// de 1280×720; o contexto do mundo é que tem uma escala de PX.
// O modo vem de js/estilo.js (carregar antes). Sem ele, fica em pixel como antes.
const SUAVE = !!(window.Estilo && window.Estilo.suave());
export const PX = SUAVE ? 1 : 0.5;
export const W = 1280,
  H = 720;

function temWebGL() {
  try {
    const t = document.createElement("canvas");
    return !!(t.getContext("webgl2") || t.getContext("webgl"));
  } catch {
    return false;
  }
}

export function iniciarPalco(canvas, aCadaQuadro) {
  const Phaser = window.Phaser;
  if (!Phaser) throw new Error("Phaser não carregou (js/vendor/phaser.min.js)");

  class Palco extends Phaser.Scene {
    constructor() {
      super("palco");
    }
    create() {
      const modo = SUAVE ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST;
      this.tm = this.textures.createCanvas("mundo", W * PX, H * PX);
      this.tt = this.textures.createCanvas("texto", W, H);
      this.tm.setFilter(modo);
      this.tt.setFilter(modo);
      this.add.image(0, 0, "mundo").setOrigin(0).setScale(1 / PX);
      this.add.image(0, 0, "texto").setOrigin(0);
      this.c = this.tm.getContext();
      this.tx = this.tt.getContext();
      this.c.__px = PX; // as funções R() e T() de sprites.js reconhecem estas marcas
      this.c.__tx = this.tx;
    }
    update() {
      const { c, tx } = this;
      tx.setTransform(1, 0, 0, 1, 0, 0);
      tx.clearRect(0, 0, W, H);
      c.setTransform(PX, 0, 0, PX, 0, 0);
      aCadaQuadro(performance.now(), c);
      this.tm.refresh();
      this.tt.refresh();
    }
  }

  return new Phaser.Game({
    // com um canvas próprio o Phaser exige o tipo explícito: WebGL se houver, senão Canvas
    type: temWebGL() ? Phaser.WEBGL : Phaser.CANVAS,
    canvas,
    width: W,
    height: H,
    backgroundColor: "#0b1030",
    banner: false,
    autoFocus: false,
    audio: { noAudio: true },
    // o teclado e o rato continuam a ser tratados pelo main.js (DOM), não pelo Phaser
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    render: { pixelArt: !SUAVE, antialias: SUAVE, roundPixels: !SUAVE },
    scale: { mode: Phaser.Scale.NONE },
    scene: Palco,
  });
}