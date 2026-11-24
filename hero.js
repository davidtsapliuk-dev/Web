/*
 * Hero: глитч-слово в стиле киберпанка.
 * Слово рисуется на canvas: цветное расслоение (бирюзовый/розовый), рваные горизонтальные
 * полосы, развёртка. Сбои случаются сами по себе и усиливаются под курсором.
 * При «Уменьшении движения» — без мерцания: слово просто стоит.
 */
(() => {
  const WORDS = ['Сайты'];
  const TICK_MS = 70;            // как часто меняется рисунок сбоя (рвано, не плавно)
  const CYAN = '#00f0ff';
  const MAGENTA = '#ff2a6d';

  const hero = document.querySelector('.hero');
  const canvas = hero && hero.querySelector('.hero__canvas');
  const wordEl = hero && hero.querySelector('.hero__word');
  if (!hero || !canvas || !wordEl) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext && canvas.getContext('2d');

  /* ---------- Запасной вариант без canvas: обычный градиентный текст ---------- */
  if (!ctx) {
    document.documentElement.classList.add('no-particles');
    return;
  }

  /* ---------- Состояние ---------- */
  let dpr = 1;
  let W = 0;
  let H = 0;
  const box = { x: 0, y: 0, w: 0, h: 0, pad: 0 };  // где стоит слово внутри hero
  let fontSize = 100;
  const text = WORDS[0];
  let energy = 0.6;             // сила сбоя 0..1 (затухает)
  let nextSpike = 0;
  let lastTick = 0;
  const alpha = 1;
  let running = false;
  let visible = true;
  let dirty = true;
  const pointer = { x: -9999, y: -9999, over: false, speed: 0 };
  // Параметры текущего кадра сбоя
  let split = 2;
  let jitterY = 0;
  let slices = [];
  let blocks = [];

  // Три слоя: основной (градиент) и два цветных для расслоения
  const layers = [0, 1, 2].map(() => {
    const c = document.createElement('canvas');
    return { c, x: c.getContext('2d') };
  });

  function fontFor(fs) { return `800 ${fs}px Unbounded, Manrope, sans-serif`; }
  function setFont(o, fs) {
    o.font = fontFor(fs);
    if ('letterSpacing' in o) o.letterSpacing = `${-0.05 * fs}px`;
  }

  // Размер шрифта, чтобы слово точно влезло по ширине
  let fitSize = 100;
  function fit(word) {
    const o = layers[0].x;
    setFont(o, fontSize);
    const w = o.measureText(word).width;
    const maxW = box.w * 0.98;
    fitSize = w > maxW ? fontSize * (maxW / w) : fontSize;
  }

  function renderLayers(str) {
    const fills = [null, CYAN, MAGENTA];
    layers.forEach((l, i) => {
      const o = l.x;
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.clearRect(0, 0, l.c.width, l.c.height);
      setFont(o, fitSize);
      o.textBaseline = 'middle';
      if (i === 0) {
        const g = o.createLinearGradient(box.pad, 0, box.pad + Math.min(box.w, fitSize * 4.2), 0);
        g.addColorStop(0, '#8a6cff');
        g.addColorStop(0.55, '#ff5e7a');
        g.addColorStop(1, '#ffb347');
        o.fillStyle = g;
      } else {
        o.fillStyle = fills[i];
      }
      o.fillText(str, box.pad, box.h * 0.54);
    });
    dirty = true;
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
    box.x = wr.left - r.left;
    box.y = wr.top - r.top;
    box.w = wordEl.parentElement.getBoundingClientRect().width;
    box.h = wr.height;
    box.pad = Math.round(Math.max(40, box.h * 0.6)); // запас по бокам для сдвигов
    fontSize = parseFloat(getComputedStyle(wordEl).fontSize);

    layers.forEach((l) => {
      l.c.width = Math.round((box.w + box.pad * 2) * dpr);
      l.c.height = Math.round(box.h * dpr);
    });
    fit(text);
    renderLayers(text);
  }

  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Новый рисунок сбоя ---------- */
  function tick() {
    const lvl = reduceMotion ? 0 : energy;
    split = reduceMotion ? 2 : 2 + lvl * rand(6, 16);
    jitterY = lvl > 0.3 ? rand(-1, 1) * lvl * 4 : 0;

    slices = [];
    if (lvl > 0.12) {
      const n = 1 + Math.floor(lvl * rand(2, 7));
      for (let i = 0; i < n; i++) {
        const sh = rand(3, box.h * (0.06 + lvl * 0.16));
        slices.push({ y: rand(0, box.h - sh), h: sh, dx: rand(-1, 1) * lvl * box.h * 0.6 });
      }
    }
    blocks = [];
    if (lvl > 0.5) {
      const n = Math.floor(lvl * 6);
      for (let i = 0; i < n; i++) {
        blocks.push({
          x: rand(0, box.w), y: rand(0, box.h),
          w: rand(10, box.h * 0.9), h: rand(2, 9),
          c: Math.random() < 0.5 ? CYAN : MAGENTA,
        });
      }
    }
    dirty = true;
  }

  /* ---------- Кадр ---------- */
  function drawLayer(l, dx, dy, sy, sh) {
    const lw = l.c.width / dpr;
    if (sh === undefined) {
      ctx.drawImage(l.c, box.x - box.pad + dx, box.y + dy, lw, box.h);
    } else {
      ctx.drawImage(l.c, 0, sy * dpr, l.c.width, sh * dpr, box.x - box.pad + dx, box.y + sy + dy, lw, sh);
    }
  }

  function drawWord(dx, sy, sh) {
    // Цветные копии — под основным словом, видны только по краям
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.9 * alpha;
    drawLayer(layers[1], dx - split, jitterY, sy, sh);
    drawLayer(layers[2], dx + split, -jitterY, sy, sh);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;
    drawLayer(layers[0], dx, 0, sy, sh);
  }

  function frame(now) {
    if (!running) return;

    // Сбои сами по себе, иногда
    if (!reduceMotion && now > nextSpike) {
      energy = Math.max(energy, rand(0.35, 0.9));
      nextSpike = now + rand(1400, 4200);
    }
    // Курсор над словом: чем быстрее движется, тем сильнее сбой
    if (!reduceMotion && pointer.over) {
      energy = Math.max(energy, Math.min(1, 0.22 + pointer.speed / 50));
      pointer.speed *= 0.85;
    }
    energy *= 0.92;
    if (energy < 0.01) energy = 0;

    if (now - lastTick > TICK_MS && (energy > 0 || slices.length)) {
      lastTick = now;
      tick();
    }

    if (dirty) {
      dirty = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawWord(0);

      // Рваные полосы: вырезаем и рисуем со сдвигом
      for (const s of slices) {
        ctx.clearRect(box.x - box.pad, box.y + s.y, box.w + box.pad * 2, s.h);
        drawWord(s.dx, s.y, s.h);
      }

      // Цифровой мусор
      for (const b of blocks) {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = b.c;
        ctx.fillRect(box.x + b.x, box.y + b.y, b.w, b.h);
      }

      // Развёртка поверх слова
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#0b0a0d';
      for (let y = box.y; y < box.y + box.h; y += 4) ctx.fillRect(box.x - box.pad, y, box.w + box.pad * 2, 2);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    dirty = true;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  /* ---------- Взаимодействие ---------- */
  let lastPX = 0;
  let lastPY = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    pointer.speed = Math.max(pointer.speed, Math.hypot(x - lastPX, y - lastPY));
    lastPX = x; lastPY = y;
    pointer.over = x > box.x - 40 && x < box.x + box.w && y > box.y - 40 && y < box.y + box.h + 40;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.over = false; });

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
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('800 100px Unbounded', WORDS.join('')), document.fonts.ready])
    : Promise.resolve();
  // Не ждём шрифт дольше 2 секунд
  const ready = Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2000))]);
  ready.catch(() => {}).then(() => {
    setup();
    start();
  });
})();
