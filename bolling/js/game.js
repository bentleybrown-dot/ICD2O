import { injectBrainStyles } from '../brain.js';

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
  const timeDisplay = document.getElementById('score');

  if (!game || !bob) return;

  let bobX = 24;
  const speed = 320; // px per second
  let leftDown = false;
  let rightDown = false;
  let startTime = performance.now();

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
    spawnInterval = null;
    if (rafId) cancelAnimationFrame(rafId);
    // show message
    if (message) {
      message.innerHTML = '';
      const text = document.createElement('div');
      text.textContent = 'Opps looks like you lose my silly loser';
      text.style.marginBottom = '14px';
      const btn = document.createElement('button');
      btn.textContent = 'Restart';
      btn.id = 'restart-btn';
      btn.style.padding = '10px 16px';
      btn.style.border = 'none';
      btn.style.borderRadius = '10px';
      btn.style.background = '#ff8c00';
      btn.style.color = '#fff';
      btn.style.fontWeight = '700';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', restart);
      message.appendChild(text);
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
    // reset timer
    startTime = performance.now();
    if (timeDisplay) timeDisplay.textContent = '0.00';
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
    const elapsed = (t - startTime) / 1000;
    if (timeDisplay) timeDisplay.textContent = elapsed.toFixed(2);
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
