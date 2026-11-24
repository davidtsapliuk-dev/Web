# Нить — сайт инди веб-студии

Одностраничный сайт студии: услуги, цены, процесс работы, команда, FAQ и форма заявки.

Чистый HTML/CSS/JS без сборки: `index.html`, `styles.css`, `script.js`.

## Запуск

Откройте `index.html` в браузере или запустите локальный сервер:

```bash
python3 -m http.server 8000
```

## Что заменить перед публикацией

- Название студии, имена и описание команды
- Цены и сроки в разделе `#pricing`
- Контакты: `@your_username` и `hello@example.com`
- Отправку формы: функция `sendForm` в `script.js` (Formspree, Telegram-бот или свой бэкенд)

## Публикация

Подойдёт GitHub Pages: Settings → Pages → Deploy from branch. Для приватного репозитория
GitHub Pages доступен только на платном плане, поэтому можно использовать Netlify или Vercel.
