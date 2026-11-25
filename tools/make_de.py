# Собирает немецкую версию de.html из index.html по словарю переводов.
# Запуск: python3 tools/make_de.py  (после любых правок русского текста)
import re,sys
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'index.html'); DST=os.path.join(ROOT,'de.html')
s=open(SRC).read()
T={
'Clearline Studio — веб-студия':'Clearline Studio — Webdesign-Studio',
'К содержимому':'Zum Inhalt',
'Услуги':'Leistungen','Работы':'Arbeiten','Процесс':'Ablauf','Цены':'Preise','Студия':'Studio',
'Обсудить проект':'Projekt besprechen',
'Индивидуальный дизайн, ручной код и внимание к каждой детали. Без шаблонов, конструкторов и посредников.':'Individuelles Design, handgeschriebener Code und Liebe zum Detail. Ohne Templates, Baukästen und Vermittler.',
'Манифест':'Manifest',
'Я не продаю шаблоны и не прячусь за менеджерами. В студии только я, и каждый сайт я делаю так,\n          будто он мой собственный: быстрым, честным, красивым до последнего пикселя\n          и&nbsp;понятным с&nbsp;первой секунды.':'Ich verkaufe keine Templates und verstecke mich nicht hinter Managern. Im Studio gibt es nur mich,\n          und jede Website baue ich so, als wäre es meine eigene: schnell, ehrlich, schön bis zum letzten Pixel\n          und verständlich ab der ersten Sekunde.',
'01 — Услуги':'01 — Leistungen','Что я делаю':'Was ich mache',
'Дизайн':'Design',
'Структура, прототип и макеты для всех экранов. С нуля, под ваш бизнес.':'Struktur, Prototyp und Layouts für alle Bildschirme. Von Grund auf, für Ihr Unternehmen.',
'Разработка':'Entwicklung',
'Быстрый чистый код, анимации, формы, интеграции с CRM и мессенджерами.':'Schneller, sauberer Code, Animationen, Formulare, Anbindung an CRM und Messenger.',
'Запуск':'Launch',
'Домен, хостинг, SEO, DSGVO и безопасность. Остаюсь на связи после запуска.':'Domain, Hosting, SEO, DSGVO und Sicherheit. Auch nach dem Launch bin ich für Sie da.',
'02 — Работы':'02 — Arbeiten','Скоро здесь':'Bald hier:','мои проекты':'meine Projekte',
'Студия только открылась, поэтому вместо портфолио пока концепты: с таких сайтов я начинаю. Ваш проект может стать первым в этом списке.':'Das Studio ist gerade gestartet, deshalb zeige ich statt eines Portfolios vorerst Konzepte: So sehen meine Ausgangspunkte aus. Ihr Projekt kann das erste in dieser Liste sein.',
'Меню':'Karte','Бронь':'Reservieren','Контакты':'Kontakt',
'Свежая обжарка':'Frisch geröstet','каждое утро':'jeden Morgen','Забронировать столик':'Tisch reservieren',
'Скоро':'Bald','Концепт · Лендинг':'Konzept · Landingpage','Кафе и кофейни':'Cafés und Röstereien',
'Меню, бронь столика, карта и отзывы — на одном экране, удобно с телефона.':'Speisekarte, Tischreservierung, Anfahrt und Bewertungen — auf einem Screen, bequem am Smartphone.',
'Ремонт под ключ':'Sanierung aus einer Hand','с гарантией':'mit Garantie','Рассчитать стоимость':'Kosten berechnen',
'Концепт · Сайт компании':'Konzept · Firmenwebsite','Мастера и строители':'Handwerk und Bau',
'Услуги, фото работ, калькулятор стоимости и заявка на замер.':'Leistungen, Referenzfotos, Kostenrechner und Anfrage für einen Aufmaßtermin.',
'Стать первым проектом →':'Erstes Projekt werden →',
'03 — Процесс':'03 — Ablauf','Пять шагов':'Fünf Schritte','до запуска':'bis zum Launch',
'Прозрачно на каждом этапе: вы всегда знаете, что происходит и что будет дальше.':'Transparent in jeder Phase: Sie wissen immer, was gerade passiert und was als Nächstes kommt.',
'Созвон · 30 мин':'Call · 30 Min.','Знакомство':'Kennenlernen',
'30-минутный созвон и короткий бриф. Разбираюсь в задаче, целях и аудитории.':'30-minütiger Call und ein kurzes Briefing. Ich verstehe Ihre Aufgabe, Ziele und Zielgruppe.',
'Фиксированная цена':'Festpreis','Договор':'Vertrag',
'Цена по выбранному тарифу, сроки и план работ. Подписываем договор.':'Preis laut gewähltem Paket, Zeitplan und Ablauf. Wir unterschreiben den Vertrag.',
'2 раунда правок':'2 Korrekturrunden',
'Прототип, затем макеты. Два раунда правок уже включены.':'Erst Prototyp, dann Layouts. Zwei Korrekturrunden sind inklusive.',
'Тестовый адрес':'Testadresse',
'Код и интеграции. Прогресс виден на тестовом адресе в любой момент.':'Code und Integrationen. Den Fortschritt sehen Sie jederzeit unter einer Testadresse.',
'Ваш домен':'Ihre Domain',
'Проверка по чек-листу, переезд на ваш домен, передача доступов.':'Prüfung nach Checkliste, Umzug auf Ihre Domain, Übergabe aller Zugänge.',
'04 — Цены':'04 — Preise','Честные цены.':'Faire Preise.','Без сюрпризов.':'Ohne Überraschungen.',
'Цена фиксирована и зависит только от выбранного тарифа — в процессе она не растёт. Оплата частями: 50% на старте, 50% после сдачи. Цены окончательные: НДС не взимается (Kleinunternehmer, §&nbsp;19&nbsp;UStG).':'Der Preis ist fest und hängt nur vom gewählten Paket ab — er steigt während des Projekts nicht. Zahlung in zwei Raten: 50&nbsp;% zum Start, 50&nbsp;% nach der Abnahme. Alle Preise sind Endpreise: Gemäß §&nbsp;19&nbsp;UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).',
'Лендинг':'Landingpage','+ 29 € / мес':'+ 29 € / Monat','+ 39 € / мес':'+ 39 € / Monat',
'(хостинг, SSL, обновления, поддержка и мелкие правки)':'(Hosting, SSL, Updates, Support und kleine Änderungen)',
'7–14 дней':'7–14 Tage','3–5 недель':'3–5 Wochen',
'До 8 смысловых блоков':'Bis zu 8 Inhaltsblöcke','Индивидуальный дизайн':'Individuelles Design',
'Адаптив под все экраны':'Optimiert für alle Bildschirme','Форма заявки с отправкой на почту':'Anfrageformular mit Versand per E-Mail',
'Хостинг, обновления и поддержка':'Hosting, Updates und Support','Выбрать':'Auswählen','Хит':'Beliebt',
'Сайт компании':'Firmenwebsite','До 10 уникальных страниц':'Bis zu 10 individuelle Seiten',
'Дизайн-концепция и UI-kit':'Designkonzept und UI-Kit','Блог или новости':'Blog oder News',
'До 2 дополнительных языков':'Bis zu 2 zusätzliche Sprachen','SEO-основа и DSGVO':'SEO-Grundlagen und DSGVO',
'05 — Студия':'05 — Studio','Один человек.':'Eine Person.','Без посредников.':'Ohne Vermittler.',
'человек от брифа до запуска':'Person vom Briefing bis zum Launch','шаблонов и конструкторов':'Templates und Baukästen',
'проекта одновременно, не больше':'Projekte gleichzeitig, nicht mehr','Давид':'David',
'Основатель студии. Дизайн, разработка, запуск и поддержка — всё делаю сам, поэтому вы всегда общаетесь напрямую с тем, кто делает ваш сайт.':'Gründer des Studios. Design, Entwicklung, Launch und Support — alles mache ich selbst. So sprechen Sie immer direkt mit der Person, die Ihre Website baut.',
'06 — Вопросы':'06 — Fragen','Частые вопросы':'Häufige Fragen',
'Может ли цена вырасти в процессе?':'Kann der Preis während des Projekts steigen?',
'Нет. Итоговая стоимость фиксирована: она определяется выбранным тарифом и указывается в договоре. Никаких скрытых доплат и сюрпризов: если вы сами захотите добавить что-то сверх оговорённого, я сначала назову цену, и без вашего согласия она не изменится.':'Nein. Der Endpreis ist fest: Er ergibt sich aus dem gewählten Paket und steht im Vertrag. Keine versteckten Zusatzkosten, keine Überraschungen: Wenn Sie selbst etwas über den vereinbarten Umfang hinaus wünschen, nenne ich zuerst den Preis — ohne Ihre Zustimmung ändert sich nichts.',
'Как менять тексты и фото на сайте?':'Wie ändere ich Texte und Fotos auf der Website?',
'Просто напишите мне в WhatsApp или на почту. Небольшие правки текстов и фото входят в поддержку (29 € в месяц для лендинга, 39 € для сайта компании).':'Schreiben Sie mir einfach per WhatsApp oder E-Mail. Kleine Text- und Bildänderungen sind im Support enthalten (29 € pro Monat für die Landingpage, 39 € für die Firmenwebsite).',
'Работаете по договору?':'Arbeiten Sie mit Vertrag?',
'Да, официально: договор, счёт (Rechnung) и все документы.':'Ja, ganz offiziell: Vertrag, Rechnung und alle Unterlagen.',
'А если результат не понравится?':'Und wenn mir das Ergebnis nicht gefällt?',
'Каждый этап согласовывается с вами, поэтому сюрпризов в конце не бывает. Если дизайн не попал в ожидания, я сделаю новую концепцию.':'Jede Phase wird mit Ihnen abgestimmt, deshalb gibt es am Ende keine Überraschungen. Trifft das Design nicht Ihre Erwartungen, erstelle ich ein neues Konzept.',
'Кому принадлежит сайт?':'Wem gehört die Website?',
'Вам. Домен, хостинг и исходный код оформляются на вас, все доступы передаю после запуска.':'Ihnen. Domain, Hosting und Quellcode laufen auf Ihren Namen, alle Zugänge übergebe ich nach dem Launch.',
'07 — Контакт':'07 — Kontakt','Давайте сделаем':'Lassen Sie uns','что-то красивое':'etwas Schönes bauen',
'Первая консультация бесплатная. Отвечу в течение рабочего дня.':'Die Erstberatung ist kostenlos. Ich antworte innerhalb eines Werktags.',
'Имя':'Name','WhatsApp или e-mail':'WhatsApp oder E-Mail','Тариф':'Paket','Пока не знаю':'Noch unsicher','Другое':'Sonstiges',
'О проекте':'Über das Projekt',
'Я согласен(-на) на обработку моих данных для ответа на заявку согласно':'Ich willige in die Verarbeitung meiner Daten zur Beantwortung meiner Anfrage gemäß der',
'Отправить заявку':'Anfrage senden','Наверх ↑':'Nach oben ↑',
'Независимая веб-студия: сайты компаний и лендинги с индивидуальным дизайном, ручным кодом и соблюдением DSGVO.':'Unabhängiges Webdesign-Studio: Firmenwebsites und Landingpages mit individuellem Design, handgeschriebenem Code und DSGVO-konform.',
'Clearline Studio — на главную':'Clearline Studio — zur Startseite','Язык сайта':'Sprache der Website','Открыть меню':'Menü öffnen',
}
# hero word
s,n=re.subn(r'<span class="hero__word" aria-label="Сайты">.*?<span class="hero__line"','<span class="hero__word" aria-label="Websites">'+''.join(f'<span class="ch" aria-hidden="true">{c}</span>' for c in 'Websites')+'<span class="hero__line"',s,flags=re.S); assert n==1
s,n=re.subn(r'Datenschutzerklärung</a>\.','Datenschutzerklärung</a> ein.',s); assert n==1
for k in sorted(T,key=len,reverse=True):
    if k not in s: print('MISSING',repr(k[:50])); continue
    s=s.replace(k,T[k])
s=re.sub(r'(<div class="person__ava"[^>]*>)Д<','\\1D<',s)
s=s.replace('<html lang="ru">','<html lang="de">')
s=s.replace('<a href="index.html" lang="ru" hreflang="ru" aria-current="page">RU</a><a href="de.html" lang="de" hreflang="de">DE</a>','<a href="index.html" lang="ru" hreflang="ru">RU</a><a href="de.html" lang="de" hreflang="de" aria-current="page">DE</a>')
left=[m for m in re.findall(r'>([^<>]*[А-Яа-яЁё][^<>]*)<',s)]
left+= re.findall(r'="([^"]*[А-Яа-яЁё][^"]*)"',s)
print('left:',left)
open(DST,'w').write(s)
