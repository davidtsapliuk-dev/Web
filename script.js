const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

/* ---------- Активный блок: рамка-градиент и подсветка за курсором ---------- */
const tiles = document.querySelectorAll('.tile');

if (canHover) {
  tiles.forEach((tile) => {
    tile.addEventListener('pointerenter', () => tile.classList.add('is-active'));
    tile.addEventListener('pointerleave', () => tile.classList.remove('is-active'));
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
      tile.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}
// Фокус с клавиатуры тоже делает блок активным
document.addEventListener('focusin', (e) => {
  const tile = e.target.closest('.tile');
  tiles.forEach((t) => t.classList.toggle('is-active', t === tile));
});

/* ---------- Появление блоков с лёгкой пружиной ---------- */
const pops = document.querySelectorAll('.pop');

if (reduceMotion || !('IntersectionObserver' in window)) {
  pops.forEach((el) => el.classList.add('in'));
  document.documentElement.classList.add('no-anim');
} else {
  const io = new IntersectionObserver((entries) => {
    // Блоки, появившиеся одновременно, раскрываются по очереди
    // Блоки, которые уже выше экрана (переход по якорю), показываем сразу
    entries.filter((e) => !e.isIntersecting && e.boundingClientRect.bottom < 0).forEach((e) => {
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) =>
      a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    visible.forEach((entry, i) => {
      entry.target.style.setProperty('--d', `${Math.min(i * 0.07, 0.5)}s`);
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  pops.forEach((el) => io.observe(el));
}

/* ---------- Счётчики ---------- */
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
  const start = performance.now();
  const dur = 1400;
  const step = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if ('IntersectionObserver' in window) {
  const countIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { countUp(e.target); countIo.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => countIo.observe(el));
}

/* ---------- Подсветка текущего раздела в меню ---------- */
const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const secIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => secIo.observe(s));
}

/* ---------- Уведомление ---------- */
let toastEl;
let toastTimer;
function notify(title, text) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.innerHTML = '<span class="toast__icon" aria-hidden="true"></span><div><p class="toast__title"></p><p class="toast__text"></p></div>';
    document.body.appendChild(toastEl);
  }
  toastEl.querySelector('.toast__title').textContent = title;
  toastEl.querySelector('.toast__text').textContent = text;
  requestAnimationFrame(() => toastEl.classList.add('is-shown'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 4200);
}

/* ---------- Выбор тарифа → форма ---------- */
const planSelect = document.getElementById('plan-select');
const messageEl = document.getElementById('message');

document.querySelectorAll('[data-plan]').forEach((btn) => {
  btn.addEventListener('click', () => {
    planSelect.value = btn.dataset.plan;
    notify('Тариф выбран', `«${btn.dataset.plan}» уже подставлен в форму заявки.`);
  });
});

/* ---------- Калькулятор ---------- */
const calc = document.getElementById('calc');
const sumEl = document.getElementById('calc-sum');
const monthlyEl = document.getElementById('calc-monthly');
const fmt = (n) => n.toLocaleString('ru-RU').replace(/ /g, ' ');

function calcState() {
  const base = calc.querySelector('input[name="base"]:checked');
  let once = parseInt(base.value, 10);
  let monthly = 0;
  const extras = [];
  calc.querySelectorAll('input[type="checkbox"]:checked').forEach((c) => {
    if (c.hasAttribute('data-monthly')) monthly += parseInt(c.value, 10);
    else once += parseInt(c.value, 10);
    extras.push(c.dataset.name);
  });
  return { name: base.dataset.name, once, monthly, extras };
}

let shown = 45000;
function renderCalc() {
  const { once, monthly } = calcState();
  monthlyEl.textContent = monthly ? `+ ${fmt(monthly)} ₽ / мес` : '';
  if (reduceMotion) { sumEl.textContent = `от ${fmt(once)} ₽`; shown = once; return; }
  const from = shown;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 450, 1);
    shown = Math.round(from + (once - from) * (1 - Math.pow(1 - t, 3)));
    sumEl.textContent = `от ${fmt(shown)} ₽`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
calc.addEventListener('change', renderCalc);

document.getElementById('calc-cta').addEventListener('click', () => {
  const { name, once, monthly, extras } = calcState();
  planSelect.value = name;
  if (!messageEl.value.trim()) {
    const parts = [`Интересует: ${name}`];
    if (extras.length) parts.push(`дополнительно: ${extras.join(', ')}`);
    parts.push(`ориентировочно от ${fmt(once)} ₽${monthly ? ` + ${fmt(monthly)} ₽/мес` : ''}`);
    messageEl.value = `${parts.join('; ')}.`;
  }
  notify('Проект собран', 'Параметры из калькулятора подставлены в форму.');
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
const SUCCESS = 'Спасибо! Мы свяжемся с вами в течение рабочего дня.';

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
    notify('Заявка отправлена', 'Ответим в течение рабочего дня.');
  } catch {
    statusEl.textContent = 'Не получилось отправить. Напишите нам в Telegram.';
  } finally {
    button.disabled = false;
  }
});

form.addEventListener('input', (e) => {
  if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid');
});

/* ---------- Год в подвале ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
