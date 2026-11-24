// Мобильное меню
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});

nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
  }
});

// Кнопка «Выбрать» в тарифе подставляет тариф в форму
const planSelect = document.getElementById('plan-select');
document.querySelectorAll('[data-plan]').forEach((btn) => {
  btn.addEventListener('click', () => {
    planSelect.value = btn.dataset.plan;
  });
});

// Форма заявки.
// Сейчас данные никуда не отправляются: подключите Formspree, Telegram-бота или свой бэкенд
// в функции sendForm.
const form = document.getElementById('contact-form');
const statusEl = form.querySelector('.form__status');

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

  let valid = true;
  form.querySelectorAll('[required]').forEach((field) => {
    const empty = !field.value.trim();
    field.setAttribute('aria-invalid', String(empty));
    if (empty) valid = false;
  });

  if (!valid) {
    statusEl.textContent = 'Заполните имя и контакт для связи.';
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  statusEl.textContent = 'Отправляем…';

  try {
    const res = await sendForm(new FormData(form));
    if (!res.ok) throw new Error();
    form.reset();
    statusEl.textContent = 'Спасибо! Мы свяжемся с вами в течение рабочего дня.';
  } catch {
    statusEl.textContent = 'Не получилось отправить. Напишите нам в Telegram.';
  } finally {
    button.disabled = false;
  }
});

// Текущий год в футере
document.getElementById('year').textContent = new Date().getFullYear();
