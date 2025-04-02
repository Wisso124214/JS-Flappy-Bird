const RAD = Math.PI / 180;
const scrn = document.getElementById('canvas');
const sctx = scrn.getContext('2d');
scrn.height = globalThis.innerHeight * 0.99;
scrn.width = globalThis.innerHeight * 0.67;
scrn.tabIndex = 1;

/**
 * Listo:
  * Diseño responsive
  * Icono
  * Añadir autofocus
  * Matar cuando alcance el tope arriba
  * Añadir speedGame
  * Arreglar cargar piso y fondo
  * Altura del salto (manual)
  * Cantidad de reducción (manual)
  * Añadir pausa
 *
 * Tiempo para llegar al máximo (manual)

 * Añadir dificultad
 * Aumentar velocidad
 */

const config = {
  // difficulty: 'easy',
  // timeToDecreaseSpace: 1000,
  // speedBird: 100,
  // yBetweenPipes: 10,
  
  xBetweenPipes: 2,
  speedGame: 35,      //0 - 100. Default is 35
  gravity: 0.2,     //0.125 as default
  jumpBird: 5,        //3.6 as default
};

// setInterval(() => {
//   config.s
// }, 1000)

const state = {
  curr: 0,
  getReady: 0,
  Play: 1,
  gameOver: 2,
};

let isGamePaused = false;
let isPageActive = false;

globalThis.onmousedown = (e) => {
  activePage(e);
  handleClick();
};
globalThis.onkeydown = (e) => {
  activePage(e);
};

const activePage = (e) => {
  scrn.focus();

  if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
    handleClick();
  } else if (e.key === 'p' || e.key === 'P') {
    state.curr = state.getReady;
    isGamePaused = true;
  }

  if (!isPageActive) {
    isPageActive = true;
  }
};

const handleClick = () => {
  switch (state.curr) {
    case state.getReady:
      state.curr = state.Play;
      SFX.start.play();
      break;
    case state.Play:
      isGamePaused = false;
      bird.flap();
      break;
    case state.gameOver:
      state.curr = state.getReady;
      bird.speed = 0;
      bird.y = 100;
      pipe.pipes = [];
      UI.score.curr = 0;
      SFX.played = false;
      break;
  }
};

let frames = 0;
let dx = config.xBetweenPipes;
const SFX = {
  start: new Audio(),
  flap: new Audio(),
  score: new Audio(),
  hit: new Audio(),
  die: new Audio(),
  played: false,
};
const gnd = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {
    this.y = parseFloat(scrn.height - this.sprite.height);
    for (let x = 0; x < scrn.width; x += this.sprite.width) {
      sctx.drawImage(this.sprite, x, this.y);
    }
  },
  update: function () {
    if (state.curr != state.Play) return;
    this.x -= dx;
    this.x = this.x % (this.sprite.width / 2);
  },
};
const bg = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {
    y = parseFloat(scrn.height - this.sprite.height);
    for (let x = 0; x < scrn.width; x += this.sprite.width) {
      sctx.drawImage(this.sprite, x, y);
    }
  },
};
const pipe = {
  top: { sprite: new Image() },
  bot: { sprite: new Image() },
  gap: 85,
  moved: true,
  pipes: [],
  draw: function () {
    for (let i = 0; i < this.pipes.length; i++) {
      let p = this.pipes[i];
      sctx.drawImage(this.top.sprite, p.x, p.y);
      sctx.drawImage(
        this.bot.sprite,
        p.x,
        p.y + parseFloat(this.top.sprite.height) + this.gap
      );
    }
  },
  update: function () {
    if (state.curr != state.Play) return;
    if (frames % 100 == 0) {
      this.pipes.push({
        x: parseFloat(scrn.width),
        y: -210 * Math.min(Math.random() + 1, 1.8),
      });
    }
    this.pipes.forEach((pipe) => {
      pipe.x -= dx;
    });

    if (this.pipes.length && this.pipes[0].x < -this.top.sprite.width) {
      this.pipes.shift();
      this.moved = true;
    }
  },
};
const bird = {
  animations: [
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
  ],
  rotatation: 0,
  x: 50,
  y: 100,
  speed: 0,
  gravity: config.gravity,
  thrust: config.jumpBird,
  frame: 0,
  draw: function () {
    let h = this.animations[this.frame].sprite.height;
    let w = this.animations[this.frame].sprite.width;
    sctx.save();
    sctx.translate(this.x, this.y);
    sctx.rotate(this.rotatation * RAD);
    sctx.drawImage(this.animations[this.frame].sprite, -w / 2, -h / 2);
    sctx.restore();
  },
  update: function () {
    let r = parseFloat(this.animations[0].sprite.width) / 2;
    switch (state.curr) {
      case state.getReady:
        this.rotatation = 0;
        this.y += frames % 10 == 0 ? Math.sin(frames * RAD) : 0;
        this.frame += frames % 10 == 0 ? 1 : 0;
        break;
      case state.Play:
        this.frame += frames % 5 == 0 ? 1 : 0;
        this.y += this.speed;
        this.setRotation();
        this.speed += this.gravity;

        if (this.y + r >= gnd.y || this.collisioned() || this.y <= 0) {
          state.curr = state.gameOver;
        }

        break;
      case state.gameOver:
        this.frame = 1;
        if (this.y + r < gnd.y) {
          this.y += this.speed;
          this.setRotation();
          this.speed += this.gravity * 2;
        } else {
          this.speed = 0;
          this.y = gnd.y - r;
          this.rotatation = 90;
          if (!SFX.played) {
            SFX.die.play();
            SFX.played = true;
          }
        }

        break;
    }
    this.frame = this.frame % this.animations.length;
  },
  flap: function () {
    if (this.y > 0) {
      SFX.flap.play();
      this.speed = -this.thrust;
    }
  },
  setRotation: function () {
    if (this.speed <= 0) {
      this.rotatation = Math.max(-25, (-25 * this.speed) / (-1 * this.thrust));
    } else if (this.speed > 0) {
      this.rotatation = Math.min(90, (90 * this.speed) / (this.thrust * 2));
    }
  },
  collisioned: function () {
    if (!pipe.pipes.length) return;
    let bird = this.animations[0].sprite;
    let x = pipe.pipes[0].x;
    let y = pipe.pipes[0].y;
    let r = bird.height / 4 + bird.width / 4;
    let roof = y + parseFloat(pipe.top.sprite.height);
    let floor = roof + pipe.gap;
    let w = parseFloat(pipe.top.sprite.width);
    if (this.x + r >= x) {
      if (this.x + r < x + w) {
        if (this.y - r <= roof || this.y + r >= floor) {
          SFX.hit.play();
          return true;
        }
      } else if (pipe.moved) {
        UI.score.curr++;
        SFX.score.play();
        pipe.moved = false;
      }
    }
  },
};
const UI = {
  getReady: { sprite: new Image() },
  gameOver: { sprite: new Image() },
  tap: [{ sprite: new Image() }, { sprite: new Image() }],
  score: {
    curr: 0,
    best: 0,
  },
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  frame: 0,
  draw: function () {
    switch (state.curr) {
      case state.getReady:
        this.y = parseFloat(scrn.height - this.getReady.sprite.height) / 2;
        this.x = parseFloat(scrn.width - this.getReady.sprite.width) / 2;
        this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
        this.ty =
          this.y + this.getReady.sprite.height - this.tap[0].sprite.height;
        sctx.drawImage(this.getReady.sprite, this.x, this.y);
        sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);

        if (isGamePaused) {
          sctx.strokeStyle = 'white';
          sctx.font = '40px Squada One';
          sctx.strokeText('PAUSED', scrn.width / 2 - 50, scrn.height / 3 - 20);
        }
        break;
      case state.gameOver:
        this.y = parseFloat(scrn.height - this.gameOver.sprite.height) / 2;
        this.x = parseFloat(scrn.width - this.gameOver.sprite.width) / 2;
        this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
        this.ty =
          this.y + this.gameOver.sprite.height - this.tap[0].sprite.height;
        sctx.drawImage(this.gameOver.sprite, this.x, this.y);
        sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        break;
    }
    this.drawScore();
  },
  drawScore: function () {
    sctx.fillStyle = '#FFFFFF';
    sctx.strokeStyle = '#000000';
    switch (state.curr) {
      case state.Play:
        sctx.lineWidth = '2';
        sctx.font = '35px Squada One';
        sctx.fillText(this.score.curr, scrn.width / 2 - 5, 50);
        sctx.strokeText(this.score.curr, scrn.width / 2 - 5, 50);
        break;
      case state.gameOver:
        sctx.lineWidth = '2';
        sctx.font = '40px Squada One';
        let sc = `SCORE :     ${this.score.curr}`;
        try {
          this.score.best = Math.max(
            this.score.curr,
            localStorage.getItem('best')
          );
          localStorage.setItem('best', this.score.best);
          let bs = `BEST  :     ${this.score.best}`;
          sctx.fillText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx.strokeText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx.fillText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
          sctx.strokeText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
        } catch (e) {
          sctx.fillText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
          sctx.strokeText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
        }

        break;
    }
  },
  update: function () {
    if (state.curr == state.Play) return;
    this.frame += frames % 10 == 0 ? 1 : 0;
    this.frame = this.frame % this.tap.length;
  },
};

gnd.sprite.src = 'img/ground.png';
bg.sprite.src = 'img/BG.png';
pipe.top.sprite.src = 'img/toppipe.png';
pipe.bot.sprite.src = 'img/botpipe.png';
UI.gameOver.sprite.src = 'img/go.png';
UI.getReady.sprite.src = 'img/getready.png';
UI.tap[0].sprite.src = 'img/tap/t0.png';
UI.tap[1].sprite.src = 'img/tap/t1.png';
bird.animations[0].sprite.src = 'img/bird/b0.png';
bird.animations[1].sprite.src = 'img/bird/b1.png';
bird.animations[2].sprite.src = 'img/bird/b2.png';
bird.animations[3].sprite.src = 'img/bird/b0.png';
SFX.start.src = 'sfx/start.wav';
SFX.flap.src = 'sfx/flap.wav';
SFX.score.src = 'sfx/score.wav';
SFX.hit.src = 'sfx/hit.wav';
SFX.die.src = 'sfx/die.wav';

function gameLoop() {
  update();
  draw();
  frames++;
}

function update() {
  bird.update();
  gnd.update();
  pipe.update();
  UI.update();
}

function draw() {
  sctx.fillStyle = '#30c0df';
  sctx.fillRect(0, 0, scrn.width, scrn.height);
  bg.draw();
  pipe.draw();

  bird.draw();
  gnd.draw();
  UI.draw();
}

const ms =
  config.speedGame < 0 || config.speedGame > 100
    ? 20
    : -0.29 * config.speedGame + 30;

setInterval(gameLoop, ms);
