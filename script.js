const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

/* ---------- Шапка: прячется при прокрутке вниз ---------- */
const hdr = document.querySelector('.hdr');
let lastY = window.scrollY;

/* ---------- Мобильное меню ---------- */
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
function setMenu(open) {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Появление ---------- */
const reveals = document.querySelectorAll('.reveal');
if (!('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => !e.isIntersecting && e.boundingClientRect.bottom < 0).forEach((e) => {
      e.target.classList.add('in'); io.unobserve(e.target);
    });
    entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((e, i) => {
        e.target.style.setProperty('--d', `${Math.min(i * 0.09, 0.6)}s`);
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  reveals.forEach((el) => io.observe(el));
}

/* ---------- Манифест: слова загораются по мере прокрутки ---------- */
const scrubEl = document.querySelector('[data-scrub]');
let scrubWords = [];
if (scrubEl) {
  const words = scrubEl.textContent.trim().split(/\s+/);
  scrubEl.textContent = '';
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = w;
    scrubEl.appendChild(span);
    if (i < words.length - 1) scrubEl.appendChild(document.createTextNode(' '));
  });
  scrubWords = [...scrubEl.querySelectorAll('.w')];
}
function updateScrub() {
  if (!scrubEl) return;
  const r = scrubEl.getBoundingClientRect();
  const vh = window.innerHeight;
  const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
  const lit = Math.round(p * scrubWords.length);
  scrubWords.forEach((w, i) => w.classList.toggle('on', i < lit));
}

/* ---------- Процесс: горизонтальная прокрутка ---------- */
const hs = document.querySelector('.hscroll');
const hsTrack = hs && hs.querySelector('.hscroll__track');
const hsBar = hs && hs.querySelector('.hscroll__bar');
let hsDistance = 0;
function setupHScroll() {
  if (!hs) return;
  const on = !reduceMotion && window.innerWidth > 1000;
  hs.classList.toggle('hscroll--on', on);
  if (!on) {
    hs.style.height = '';
    hsTrack.style.transform = '';
    hsDistance = 0;
    return;
  }
  hsDistance = Math.max(0, hsTrack.scrollWidth - window.innerWidth);
  hs.style.height = `${hsDistance + window.innerHeight}px`;
  updateHScroll();
}
function updateHScroll() {
  if (!hsDistance) return;
  const top = hs.getBoundingClientRect().top;
  const p = clamp(-top / hsDistance, 0, 1);
  hsTrack.style.transform = `translate3d(${-p * hsDistance}px, 0, 0)`;
  hsBar.style.setProperty('--p', p.toFixed(4));
}

/* ---------- Подсветка текущего раздела ---------- */
const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
const navTargets = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
function updateNav() {
  const mid = window.innerHeight * 0.45;
  let current = null;
  navTargets.forEach((s, i) => {
    if (!s) return;
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) current = navLinks[i];
  });
  navLinks.forEach((a) => a.classList.toggle('is-current', a === current));
}

/* ---------- Общий обработчик прокрутки ---------- */
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  hdr.classList.toggle('is-scrolled', y > 20);
  if (!nav.classList.contains('is-open')) hdr.classList.toggle('is-hidden', y > lastY && y > 400);
  lastY = y;
  updateScrub();
  updateHScroll();
  updateNav();
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  setupHScroll();
});
window.addEventListener('load', setupHScroll);
setupHScroll();
onScroll();

/* ---------- Эффекты для мыши ---------- */
if (finePointer) {
  // Свечение за курсором в услугах
  const svc = document.querySelector('[data-orb]');
  const orb = document.querySelector('.orb');
  if (svc && orb) {
    const section = svc.closest('.section');
    let ox = 0, oy = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      ox += (tx - ox) * 0.12; oy += (ty - oy) * 0.12;
      orb.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
      raf = Math.abs(tx - ox) + Math.abs(ty - oy) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    svc.addEventListener('pointerenter', () => orb.classList.add('is-on'));
    svc.addEventListener('pointerleave', () => orb.classList.remove('is-on'));
    svc.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  // 3D-наклон карточек тарифов с бликом
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.transition = 'transform .15s ease-out, border-color .4s';
      card.style.transform = `rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(0)`;
      card.style.setProperty('--gx', `${x * 100}%`);
      card.style.setProperty('--gy', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.transition = '';
      card.style.transform = '';
    });
  });

  // «Магнитные» кнопки
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // Кольцо-курсор
  const cursor = document.createElement('div');
  cursor.className = 'cursor is-hidden';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);
  let cx = -100, cy = -100, mx = -100, my = -100;
  const follow = () => {
    cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    cursor.classList.remove('is-hidden');
    cursor.classList.toggle('is-link', !!e.target.closest('a, button, label, summary, select'));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
}

/* ---------- Счётчики ---------- */
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 1800, 1);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 4))));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if ('IntersectionObserver' in window) {
  const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));
}

/* ---------- Уведомление ---------- */
let toastEl, toastTimer;
function notify(text) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.innerHTML = '<span class="toast__dot" aria-hidden="true"></span><span class="toast__text"></span>';
    document.body.appendChild(toastEl);
  }
  toastEl.querySelector('.toast__text').textContent = text;
  requestAnimationFrame(() => toastEl.classList.add('is-shown'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 3600);
}

/* ---------- Тариф → форма ---------- */
const planSelect = document.getElementById('plan-select');
const messageEl = document.getElementById('message');
document.querySelectorAll('[data-plan]').forEach((btn) => {
  btn.addEventListener('click', () => {
    planSelect.value = btn.dataset.plan;
    notify(`«${btn.dataset.plan}» выбран — он уже в форме заявки`);
  });
});

/* ---------- Форма заявки ----------
   Сейчас данные никуда не отправляются: подключите Formspree, Telegram-бота или свой бэкенд
   в функции sendForm (и добавьте адрес сервиса в Content-Security-Policy: connect-src).

   Защита от спама здесь — только первый фильтр против простых ботов. Сервис или бэкенд,
   который принимает заявку, обязан сам проверять и ограничивать данные (длина, частота
   запросов), и никогда не вставлять их в HTML без экранирования. */
const form = document.getElementById('contact-form');
const statusEl = form.querySelector('.form__status');
const formOpenedAt = Date.now();
const MIN_FILL_TIME_MS = 3000; // человек не заполнит форму быстрее 3 секунд
const SUCCESS = 'Спасибо! Я свяжусь с вами в течение рабочего дня.';

async function sendForm(data) {
  // Пример для Formspree:
  // return fetch('https://formspree.io/f/ВАШ_ID', {
  //   method: 'POST',
  //   headers: { Accept: 'application/json' },
  //   body: data,
  // });
  console.log('Заявка:', Object.fromEntries(data));
  return { ok: true };
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Бот: заполнил скрытое поле или отправил форму мгновенно.
  // Делаем вид, что всё прошло успешно, но ничего не отправляем.
  const isBot = form.elements.website.value !== '' || Date.now() - formOpenedAt < MIN_FILL_TIME_MS;
  if (isBot) {
    form.reset();
    statusEl.textContent = SUCCESS;
    return;
  }

  let valid = true;
  form.querySelectorAll('[required]').forEach((field) => {
    const empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
    field.setAttribute('aria-invalid', String(empty));
    if (empty) valid = false;
  });
  if (!valid) {
    statusEl.textContent = 'Заполните имя, контакт и подтвердите согласие на обработку данных.';
    return;
  }

  const data = new FormData(form);
  data.delete('website');

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  statusEl.textContent = 'Отправляем…';
  try {
    const res = await sendForm(data);
    if (!res.ok) throw new Error();
    form.reset();
    statusEl.textContent = SUCCESS;
    notify('Заявка отправлена — скоро отвечу');
  } catch {
    statusEl.textContent = 'Не получилось отправить. Напишите мне в Telegram.';
  } finally {
    button.disabled = false;
  }
});
form.addEventListener('input', (e) => {
  if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid');
});

/* ---------- Год ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
