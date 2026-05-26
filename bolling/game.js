import { injectBrainStyles } from './brain.js';

let coconuts = [];
let spawnInterval = null;
let rafId = null;
let lastTime = 0;
let running = false;

export function startGame() {
  injectBrainStyles();
  const game = document.querySelector('.game');
  const bob = document.querySelector('.bob');
  const message = document.querySelector('.message');

  if (!game || !bob) return;

  let bobX = 24;
  const speed = 320; // px per second
  let leftDown = false;
  let rightDown = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') leftDown = true;
    if (e.code === 'ArrowRight') rightDown = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') leftDown = false;
    if (e.code === 'ArrowRight') rightDown = false;
  });

  function spawnCoconut() {
    const el = document.createElement('div');
    el.className = 'coconut';
    const size = 44;
    const x = Math.random() * Math.max(0, game.clientWidth - size);
    el.style.left = x + 'px';
    el.style.top = '-60px';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    game.appendChild(el);
    coconuts.push({ el, vy: 80 + Math.random() * 80 });
  }

  function rectsIntersect(a, b) {
    return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
  }

  function gameOver() {
    running = false;
    clearInterval(spawnInterval);
    if (rafId) cancelAnimationFrame(rafId);
    // show message
    if (message) {
      message.textContent = 'Oops you died.';
      const btn = document.createElement('button');
      btn.textContent = 'Restart';
      btn.style.marginTop = '10px';
      btn.id = 'restart-btn';
      btn.addEventListener('click', restart);
      message.appendChild(document.createElement('br'));
      message.appendChild(btn);
      message.classList.add('visible');
    }
  }

  function restart() {
    // remove coconuts
    coconuts.forEach(c => c.el.remove());
    coconuts = [];
    // reset bob
    bobX = 24;
    bob.style.left = bobX + 'px';
    // hide message
    if (message) {
      message.classList.remove('visible');
      message.textContent = '';
    }
    // restart loops
    startLoops();
  }

  function startLoops() {
    if (running) return;
    running = true;
    // initial spawn
    spawnCoconut();
    spawnInterval = setInterval(spawnCoconut, 700);
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function loop(t) {
    const dt = (t - lastTime) / 1000;
    lastTime = t;
    // move bob
    if (leftDown) bobX -= speed * dt;
    if (rightDown) bobX += speed * dt;
    bobX = clamp(bobX, 0, game.clientWidth - bob.offsetWidth);
    bob.style.left = bobX + 'px';

    // update coconuts
    for (let i = coconuts.length - 1; i >= 0; i--) {
      const obj = coconuts[i];
      obj.vy += 400 * dt; // gravity
      const el = obj.el;
      const top = parseFloat(el.style.top || '-60');
      const ny = top + obj.vy * dt;
      el.style.top = ny + 'px';
      // collision
      const bRect = bob.getBoundingClientRect();
      const cRect = el.getBoundingClientRect();
      if (rectsIntersect(bRect, cRect)) {
        gameOver();
        return;
      }
      // remove off-screen
      if (ny > game.clientHeight + 100) {
        el.remove();
        coconuts.splice(i, 1);
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  // expose restart via global for manual testing
  window._restartGame = restart;

  startLoops();
}

export default startGame;
