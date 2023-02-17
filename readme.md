# Дані відключення електропостачання у Чернівцях

Цей репозиторій містить дані про відключення електропостачання у Чернівцях.

## Дані

Для використання та дослідження доступні такі дані:

- `/outages/history/yyyy-MM-dd`
  - `data.json` – дані відключень
  - `readme.md` — опис даних
  - `table.png` – обрізане зображення таблиці з сайту (_застаріле_)
  - `raw.png` — нормалізоване оригінальне зображення з сайту (_застаріле_)
- `/outages/latest` – найсвіжіші дані про відключення

Доступ до даних можна отримати за допомогою GitHub URI, наприклад:

```
https://raw.githubusercontent.com/denysdovhan/chernivtsi-outages/main/outages/latest/data.json
```

або

```
https://raw.githubusercontent.com/denysdovhan/chernivtsi-outages/main/outages/history/{yyyy-MM-dd}/data.json
```

### Формат даних

Дані зберігаються у форматі JSON у файлі `data.json`. Кожен файл містить об'єкт з такої структури:

```json
{
  "date": "2023-01-29",
  "data": [
    ["off", "off", "on", "on", …],
    ["on", "on", "off", "off", …],
    …
  ]
}
```

Поле `data` – це масив груп відключень. Кожна група – це масив, що містить стан електропостачання у кожній з 24 годин доби. Стан може бути `on` (електропостачання працює), `off` (електропостачання відключено) або `unknown` (можливо відключено).

## Як це працює

Кожні кілька годин запускається скрипт, який витягує дані з сайту [Чернівціобленерго](https://oblenergo.cv.ua/shutdowns/), конфертує дані у формат JSON та зберігає у відповідні папки. Код можна знайти у файлі `index.ts`.

## Ліцензія

MIT © Денис Довгань

---

# Electricity outages in Chernivtsi

This repository contains data about electricity outages in Chernivtsi.

## Data

The following data is available for use and research:

- `/outages/history/yyyy-MM-dd`
  - `data.json` – data about outages
  - `readme.md` — data description
    - `table.png` – cropped image of the table from the site (_deprecated_)
    - `raw.png` — normalized original image from the site (_deprecated_)
- `/outages/latest` – the latest data about outages

You can access the data using GitHub user content URI, like this:

```
https://raw.githubusercontent.com/denysdovhan/chernivtsi-outages/main/outages/latest/data.json
```

or

```
https://raw.githubusercontent.com/denysdovhan/chernivtsi-outages/main/outages/history/{yyyy-MM-dd}/data.json
```

### Data format

Data is stored in JSON format in the `data.json` file. Each file contains an object with the following structure:

```json
{
  "date": "2023-01-29",
  "data": [
    ["off", "off", "on", "on", …],
    ["on", "on", "off", "off", …],
    …
  ]
}
```

The `data` field is an array of outage groups. Each group is an array that contains the status of the power supply for each of the 24 hours of the day. The status can be `on` (power supply is working), `off` (power supply is off) or `unknown` (possibly off).

## How it works

A script is run every few hours that extracts data from the [Chernivtsioblenergo](https://oblenergo.cv.ua/shutdowns/) site, converts the data to JSON format and saves it in the corresponding folders. The code can be found in the `index.ts` file.

## License

MIT © Denis Dovgan
