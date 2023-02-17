import { JSDOM } from 'jsdom';
import { parse } from 'date-fns';
import dateFns from 'date-fns-tz';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownTable } from 'markdown-table';

type Connectivity = 'on' | 'off' | 'unknown';
type OutagesTable = Connectivity[][];

const URL = 'https://oblenergo.cv.ua/shutdowns/';
const TZ = 'Europe/Kiev';

interface OutagesData {
  table: OutagesTable;
  date: Date;
}

function mapValues(text: string): Connectivity {
  switch (text.trim().toLowerCase()) {
    case 'з':
      return 'on';
    case 'в':
      return 'off';
    case 'мз':
      return 'unknown';
    default:
      return 'unknown';
  }
}

function mapValuesToEmoji(value: Connectivity): '🟩' | '🟥' | '🟨' {
  switch (value) {
    case 'on':
      return '🟩';
    case 'off':
      return '🟥';
    case 'unknown':
      return '🟨';
    default:
      return '🟨';
  }
}

function tableToEmoji(table: OutagesTable) {
  return table.map((row) => row.map(mapValuesToEmoji));
}

function toTimestamp(date: Date): string {
  // Convert date to a local timezone
  return dateFns.format(dateFns.utcToZonedTime(date, TZ), 'yyyy-MM-dd', {
    timeZone: TZ,
  });
}

async function fetchData(): Promise<OutagesData> {
  const dom = await JSDOM.fromURL(URL);
  const groupRowsEl = dom.window.document.querySelectorAll('#gsv div[id^=inf]');
  const dateEl = dom.window.document.querySelector('#gsv_t b');
  const date = parse(dateEl?.textContent?.trim()!, 'dd.MM.yyyy', Date.now());

  const table = Array.from(groupRowsEl, (row) =>
    Array.from(row.children, (cell) => mapValues(cell.textContent ?? ''))
  );

  return { date, table };
}

export function dataToMarkdown(table: OutagesTable, timestamp: string) {
  const hours = Array(24)
    .fill(0)
    .map((_, index) => `${index + 1}`);
  const headers = ['Group/Hour', ...hours];
  const tableWithEmojis = tableToEmoji(table);
  const tableWithDescription = [
    headers,
    ...tableWithEmojis.map((row, index) => [`${index + 1}`, ...row]),
  ];
  const tableString = markdownTable(tableWithDescription, {
    padding: false,
  });
  return `# ${timestamp}\n\n${tableString}`;
}

export function dataToCSV(table: OutagesTable) {
  return table
    .map((row) => row.join(','))
    .join('\n')
    .concat('\n');
}

export async function storeData({ table, date }: OutagesData) {
  const timestamp = toTimestamp(date);
  const json = JSON.stringify({ date: timestamp, data: table });
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  const readme = dataToMarkdown(table, timestamp);
  const csv = dataToCSV(table);

  const diskOperations = ['latest', `history/${timestamp}`].map(async (dir) => {
    const dest = path.join(dirname, '/outages', dir);
    await fs.mkdir(dest, { recursive: true });
    await fs.writeFile(path.join(dest, `data.json`), json);
    await fs.writeFile(path.join(dest, `data.csv`), csv);
    await fs.writeFile(path.join(dest, `readme.md`), readme);
  });

  return Promise.all(diskOperations);
}

export async function extractOutages() {
  const data = await fetchData();
  console.log(dataToMarkdown(data.table, toTimestamp(data.date)));
  return storeData(data);
}
