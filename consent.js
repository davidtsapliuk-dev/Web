/*
 * Cookie-баннер на базе CookieConsent v3 (MIT, файлы лежат в vendor/cookieconsent/).
 *
 * СЕЙЧАС ВЫКЛЮЧЕН: на сайте нет cookies и сервисов, которым нужно согласие (§25 TDDDG),
 * поэтому баннер не показывается и библиотека даже не загружается.
 *
 * Как включить, когда появится аналитика / реклама / YouTube и т. п.:
 *   1. Поставьте CONSENT_ENABLED = true.
 *   2. Опишите сервис в categories.analytics.services (или добавьте новую категорию
 *      и тексты для неё в translations).
 *   3. Подключите скрипт сервиса так, чтобы он не запускался до согласия:
 *        <script type="text/plain" data-category="analytics" src="..."></script>
 *      CookieConsent сам запустит его после «Akzeptieren».
 *   4. Добавьте абзац об инструменте согласия и о самом сервисе в Datenschutzerklärung.
 */
const CONSENT_ENABLED = false;

(function () {
  if (!CONSENT_ENABLED) return;

  // Ссылка «Cookie-Einstellungen» в подвале видна только при включённом баннере
  document.querySelectorAll('[data-cc="show-preferencesModal"]').forEach((el) => {
    el.hidden = false;
  });

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'vendor/cookieconsent/cookieconsent.css';
  document.head.appendChild(css);

  const script = document.createElement('script');
  script.src = 'vendor/cookieconsent/cookieconsent.umd.js';
  script.onload = init;
  document.head.appendChild(script);

  function init() {
    window.CookieConsent.run({
      guiOptions: {
        consentModal: { layout: 'box', position: 'bottom left', equalWeightButtons: true },
        preferencesModal: { layout: 'box', equalWeightButtons: true },
      },

      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {
          autoClear: { cookies: [{ name: /^_ga/ }] },
          services: {
            // Пример:
            // plausible: { label: 'Plausible Analytics' },
          },
        },
      },

      language: {
        default: 'de',
        autoDetect: 'document', // берёт язык из <html lang="...">
        translations: {
          de: {
            consentModal: {
              title: 'Wir verwenden Cookies',
              description:
                'Wir nutzen notwendige Cookies, damit die Website funktioniert. Mit Ihrer Zustimmung verwenden wir zusätzlich Statistik-Cookies, um die Website zu verbessern.',
              acceptAllBtn: 'Alle akzeptieren',
              acceptNecessaryBtn: 'Alle ablehnen',
              showPreferencesBtn: 'Einstellungen',
              footer: '<a href="datenschutz.html">Datenschutz</a> · <a href="impressum.html">Impressum</a>',
            },
            preferencesModal: {
              title: 'Cookie-Einstellungen',
              acceptAllBtn: 'Alle akzeptieren',
              acceptNecessaryBtn: 'Alle ablehnen',
              savePreferencesBtn: 'Auswahl speichern',
              closeIconLabel: 'Schließen',
              sections: [
                {
                  description:
                    'Hier können Sie festlegen, welche Cookies wir verwenden dürfen. Ihre Auswahl können Sie jederzeit über „Cookie-Einstellungen“ im Footer ändern.',
                },
                {
                  title: 'Notwendig',
                  description: 'Für den Betrieb der Website erforderlich. Können nicht deaktiviert werden.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Statistik',
                  description: 'Helfen uns zu verstehen, wie Besucher die Website nutzen.',
                  linkedCategory: 'analytics',
                },
                {
                  title: 'Weitere Informationen',
                  description: 'Details finden Sie in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.',
                },
              ],
            },
          },

          ru: {
            consentModal: {
              title: 'Мы используем cookies',
              description:
                'Необходимые cookies нужны для работы сайта. С вашего согласия мы также используем статистические cookies, чтобы улучшать сайт.',
              acceptAllBtn: 'Принять все',
              acceptNecessaryBtn: 'Отклонить все',
              showPreferencesBtn: 'Настройки',
              footer: '<a href="datenschutz.html">Datenschutz</a> · <a href="impressum.html">Impressum</a>',
            },
            preferencesModal: {
              title: 'Настройки cookies',
              acceptAllBtn: 'Принять все',
              acceptNecessaryBtn: 'Отклонить все',
              savePreferencesBtn: 'Сохранить выбор',
              closeIconLabel: 'Закрыть',
              sections: [
                {
                  description:
                    'Выберите, какие cookies мы можем использовать. Изменить выбор можно в любой момент по ссылке «Cookie-Einstellungen» внизу страницы.',
                },
                {
                  title: 'Необходимые',
                  description: 'Нужны для работы сайта, отключить нельзя.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Статистика',
                  description: 'Помогают понять, как посетители пользуются сайтом.',
                  linkedCategory: 'analytics',
                },
              ],
            },
          },
        },
      },
    });
  }
})();
