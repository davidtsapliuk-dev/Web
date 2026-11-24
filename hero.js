/*
 * Hero: слово из тысяч частиц.
 * Частицы собираются в слово, разлетаются при смене слова, убегают от курсора/пальца,
 * а по клику взрываются. При «Уменьшении движения» частицы сразу стоят на месте,
 * а слова сменяются плавным затуханием, без разлёта. Без canvas — обычный градиентный текст.
 */
(() => {
  const WORDS = ['сайты', 'лендинги', 'бренды'];
  const CYCLE_MS = 7000;   // как долго держится каждое слово

  const hero = document.querySelector('.hero');
  const canvas = hero && hero.querySelector('.hero__canvas');
  const wordEl = hero && hero.querySelector('.hero__word');
  if (!hero || !canvas || !wordEl) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext && canvas.getContext('2d');

  /* ---------- Запасной вариант: текст со сменой слов ---------- */
  if (!ctx) {
    document.documentElement.classList.add('no-particles');
    let i = 0;
    setInterval(() => {
      wordEl.classList.add('is-swapping');
      setTimeout(() => {
        i = (i + 1) % WORDS.length;
        wordEl.textContent = WORDS[i];
        wordEl.classList.remove('is-swapping');
      }, 450);
    }, CYCLE_MS);
    return;
  }

  /* ---------- Состояние ---------- */
  let dpr = 1;
  let W = 0;
  let H = 0;
  let wordIndex = 0;
  let targets = [];        // точки для каждого слова: [Float32Array x,y,x,y...]
  let gap = 4;             // шаг сетки выборки
  let size = 2.4;          // размер частицы
  let radius = 120;        // радиус влияния курсора
  let fill = null;         // градиентная заливка
  let N = 0;
  let px, py, vx, vy, tx, ty, seed;
  let running = false;
  let visible = true;
  let lastInteract = 0;
  let cycleTimer = 0;
  let alpha = 1;           // общая прозрачность (для плавной смены слов)
  let fadeTo = 1;
  let pendingWord = -1;
  const pointer = { x: -9999, y: -9999, active: false };

  /* ---------- Выборка точек из текста ---------- */
  function sampleWord(word, fontSize, boxW, boxH) {
    const off = document.createElement('canvas');
    off.width = Math.ceil(boxW);
    off.height = Math.ceil(boxH);
    const o = off.getContext('2d', { willReadFrequently: true });
    let fs = fontSize;
    const setFont = () => {
      o.font = `800 ${fs}px Unbounded, Manrope, sans-serif`;
      if ('letterSpacing' in o) o.letterSpacing = `${-0.05 * fs}px`;
    };
    setFont();
    // Слово должно поместиться по ширине
    const maxW = boxW * 0.98;
    const w = o.measureText(word).width;
    if (w > maxW) { fs *= maxW / w; setFont(); }
    o.textBaseline = 'middle';
    o.fillStyle = '#fff';
    o.fillText(word, 0, boxH * 0.54);

    const data = o.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    const g = Math.max(3, Math.round(fs / 40));
    for (let y = 0; y < off.height; y += g) {
      for (let x = 0; x < off.width; x += g) {
        if (data[(y * off.width + x) * 4 + 3] > 140) pts.push(x, y);
      }
    }
    return { pts, g, width: Math.min(w, maxW) };
  }

  function shuffle(arr) {
    // Перемешиваем пары координат
    for (let i = arr.length / 2 - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const ax = arr[i * 2], ay = arr[i * 2 + 1];
      arr[i * 2] = arr[j * 2]; arr[i * 2 + 1] = arr[j * 2 + 1];
      arr[j * 2] = ax; arr[j * 2 + 1] = ay;
    }
    return arr;
  }

  /* ---------- Настройка под размер экрана ---------- */
  function setup() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    const wr = wordEl.getBoundingClientRect();
    const boxW = wordEl.parentElement.getBoundingClientRect().width;
    const fontSize = parseFloat(getComputedStyle(wordEl).fontSize);
    const left = wr.left - r.left;
    const top = wr.top - r.top;

    let widest = 0;
    targets = WORDS.map((word) => {
      const s = sampleWord(word, fontSize, boxW, wr.height);
      gap = s.g;
      widest = Math.max(widest, s.width);
      const pts = shuffle(s.pts);
      for (let i = 0; i < pts.length; i += 2) { pts[i] += left; pts[i + 1] += top; }
      return pts;
    });

    size = Math.max(1.6, gap * 0.62);
    radius = Math.max(70, Math.min(170, fontSize * 0.85));

    fill = ctx.createLinearGradient(left, 0, left + Math.max(widest, 200), 0);
    fill.addColorStop(0, '#8a6cff');
    fill.addColorStop(0.55, '#ff5e7a');
    fill.addColorStop(1, '#ffb347');

    const need = Math.max(...targets.map((t) => t.length / 2));
    if (need !== N) {
      const old = { N, px, py, vx, vy };
      N = need;
      px = new Float32Array(N); py = new Float32Array(N);
      vx = new Float32Array(N); vy = new Float32Array(N);
      tx = new Float32Array(N); ty = new Float32Array(N);
      seed = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        if (i < old.N) {
          px[i] = old.px[i]; py[i] = old.py[i]; vx[i] = old.vx[i]; vy[i] = old.vy[i];
        } else if (reduceMotion) {
          px[i] = -9999; py[i] = -9999; // встанут на место в assign()
        } else {
          // Новые частицы прилетают из случайных точек экрана
          px[i] = Math.random() * W;
          py[i] = Math.random() * H;
        }
        seed[i] = Math.random() * Math.PI * 2;
      }
    }
    assign(wordIndex, false);
  }

  function assign(index, burst) {
    const t = targets[index];
    const count = t.length / 2;
    for (let i = 0; i < N; i++) {
      const k = (i % count) * 2;
      tx[i] = t[k];
      ty[i] = t[k + 1];
      if (reduceMotion && !burst) { px[i] = tx[i]; py[i] = ty[i]; vx[i] = 0; vy[i] = 0; }
      if (burst) {
        const a = Math.random() * Math.PI * 2;
        const f = 2 + Math.random() * 5;
        vx[i] += Math.cos(a) * f;
        vy[i] += Math.sin(a) * f;
      }
    }
  }

  function nextWord() {
    wordIndex = (wordIndex + 1) % WORDS.length;
    if (reduceMotion) {
      // Без разлёта: гасим слово, ставим частицы на новые места, проявляем
      pendingWord = wordIndex;
      fadeTo = 0;
    } else {
      assign(wordIndex, true);
    }
  }

  function scheduleCycle() {
    clearInterval(cycleTimer);
    cycleTimer = setInterval(() => {
      if (!visible || document.hidden) return;
      if (performance.now() - lastInteract < 3000) return;
      nextWord();
    }, CYCLE_MS);
  }

  /* ---------- Кадр ---------- */
  function frame(now) {
    if (!running) return;
    const t = now * 0.0015;
    const R = radius;
    const R2 = R * R;
    const mx = pointer.x;
    const my = pointer.y;

    for (let i = 0; i < N; i++) {
      // Лёгкое «дыхание» вокруг цели
      const gx = tx[i] + Math.sin(t + seed[i]) * 0.7;
      const gy = ty[i] + Math.cos(t * 1.3 + seed[i]) * 0.7;
      let ax = (gx - px[i]) * 0.018;
      let ay = (gy - py[i]) * 0.018;

      if (pointer.active) {
        const dx = px[i] - mx;
        const dy = py[i] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R);
          const force = f * f * 9;
          ax += (dx / d) * force;
          ay += (dy / d) * force;
        }
      }
      vx[i] = (vx[i] + ax) * 0.9;
      vy[i] = (vy[i] + ay) * 0.9;
      px[i] += vx[i];
      py[i] += vy[i];
    }

    if (alpha !== fadeTo) {
      alpha += Math.sign(fadeTo - alpha) * 0.04;
      if (Math.abs(alpha - fadeTo) < 0.04) alpha = fadeTo;
      if (alpha === 0 && pendingWord >= 0) { assign(pendingWord, false); pendingWord = -1; fadeTo = 1; }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = fill;

    // Мягкое свечение
    ctx.globalAlpha = 0.16 * alpha;
    ctx.beginPath();
    const gs = size * 2.6;
    const go = (gs - size) / 2;
    for (let i = 0; i < N; i++) ctx.rect(px[i] - go, py[i] - go, gs, gs);
    ctx.fill();

    // Сами частицы
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < N; i++) ctx.rect(px[i], py[i], size, size);
    ctx.fill();

    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  /* ---------- Взаимодействие ---------- */
  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }
  hero.addEventListener('pointermove', (e) => {
    toLocal(e);
    pointer.active = true;
    lastInteract = performance.now();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.active = false; });
  hero.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') pointer.active = false; });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    toLocal(e);
    lastInteract = performance.now();
    // Взрыв вокруг точки клика и смена слова
    for (let i = 0; i < N; i++) {
      const dx = px[i] - pointer.x;
      const dy = py[i] - pointer.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = Math.max(0, 1 - d / (radius * 3)) * 38;
      vx[i] += (dx / d) * f;
      vy[i] += (dy / d) * f;
    }
    setTimeout(nextWord, 400);
    if (e.pointerType !== 'mouse') pointer.active = true;
  });

  /* ---------- Видимость и размеры ---------- */
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });

  let resizeTimer = 0;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    // На телефонах высота меняется при прокрутке (адресная строка) — пересобираем только при смене ширины
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 200);
  });

  /* ---------- Запуск после загрузки шрифта ---------- */
  const ready = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('800 100px Unbounded', WORDS.join('')), document.fonts.ready])
    : Promise.resolve();
  ready.catch(() => {}).then(() => {
    setup();
    start();
    scheduleCycle();
  });
})();
