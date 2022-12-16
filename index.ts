import sharp, { Stats, OutputInfo } from 'sharp';
import { utcToZonedTime, format } from 'date-fns-tz';
import { promises as fs } from 'node:fs';
import path from 'node:path';

type BufferWithInfo = {
  data: Buffer;
  info: OutputInfo;
};
type Connectivity = 1 | 0;
type DataTable = Connectivity[][];

const UNIFIED_WIDTH = 900;

const LEGEND_HEIGHT = 57;
const HEADER_HEIGHT = 57;
const GROUPS_WIDTH = 180;
const TABLE_WIDTH = 720;
const TABLE_HEIGHT = 485;

const COLUMNS = 24; // 24 hours
const ROWS = 18; // 18 groups

const URL = 'http://oblenergo.cv.ua/shutdowns/GPV.png';

const TZ = 'Europe/Kiev';

function toTimestamp(date: Date | string): string {
  // Convert date to a local timezone
  return format(utcToZonedTime(date, TZ), 'yyyy-MM-dd', { timeZone: TZ });
}

async function fetchImage(url: string): Promise<Buffer> {
  console.log(`Fetching image from ${url}`);

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer;
}

async function normalizeImage(
  buffer: string | Buffer
): Promise<BufferWithInfo> {
  console.log('Normalizing image for further processing...');

  return sharp(buffer)
    .resize(UNIFIED_WIDTH)
    .trim()
    .toFormat('png')
    .toBuffer({ resolveWithObject: true });
}

async function extractTableImage({
  data,
  info,
}: BufferWithInfo): Promise<BufferWithInfo> {
  console.log('Extracting table image...');

  const header = await sharp(data)
    .extract({
      left: 0,
      top: 0,
      width: info.width,
      height: 57,
    })
    .toBuffer();
  const headerDominantColor = await getDominantColor(header);
  // Is legend present or not?
  const isLegendPresent =
    headerDominantColor.r > 220 &&
    headerDominantColor.g > 220 &&
    headerDominantColor.b > 220;
  const topOffset = isLegendPresent
    ? LEGEND_HEIGHT + HEADER_HEIGHT
    : HEADER_HEIGHT;

  console.log(`Legend is ${isLegendPresent ? 'present' : 'absent'}.`);

  return sharp(data)
    .extract({
      left: GROUPS_WIDTH,
      top: topOffset,
      width: Math.min(TABLE_WIDTH, info.width - GROUPS_WIDTH),
      height: Math.min(TABLE_HEIGHT, info.height - topOffset),
    })
    .toBuffer({ resolveWithObject: true });
}

async function extractCellImage(
  { data, info }: BufferWithInfo,
  rowIndex: number,
  cellIndex: number
): Promise<Buffer> {
  const cellWidth = info.width / COLUMNS;
  const cellHeight = info.height / ROWS;

  return sharp(data)
    .extract({
      left: Math.floor(cellIndex * cellWidth),
      top: Math.floor(rowIndex * cellHeight),
      width: Math.floor(cellWidth),
      height: Math.floor(cellHeight),
    })
    .toBuffer();
}

async function getDominantColor(buffer: Buffer): Promise<Stats['dominant']> {
  return sharp(buffer)
    .stats()
    .then(({ dominant }) => dominant);
}

async function tableImageToData(
  bufferWithInfo: BufferWithInfo
): Promise<DataTable> {
  const table: DataTable = [];

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    table[rowIndex] = [];

    for (let cellIndex = 0; cellIndex < COLUMNS; cellIndex++) {
      const cell = await extractCellImage(bufferWithInfo, rowIndex, cellIndex);
      const { r, g } = await getDominantColor(cell);
      table[rowIndex][cellIndex] = r > g ? 0 : 1;
    }

    console.log(
      `Group ${rowIndex + 1}: `,
      table[rowIndex].map((c) => (c ? '🟩' : '🟥')).join('')
    );
  }

  return table;
}

async function storeData(
  data: DataTable,
  table: Buffer,
  raw: Buffer,
  date: Date | string
) {
  const timestamp = toTimestamp(date);
  const json = JSON.stringify({
    date: timestamp,
    data,
  });

  console.log(`Storing data to disk for ${timestamp}`);

  const diskOperations = ['latest', `history/${timestamp}`].map(async (dir) => {
    const dest = path.join(__dirname, '/outages', dir);
    await fs.mkdir(dest, { recursive: true });
    await fs.writeFile(path.join(dest, `data.json`), json);
    await fs.writeFile(path.join(dest, 'table.png'), table);
    await fs.writeFile(path.join(dest, 'raw.png'), raw);
  });

  return Promise.all(diskOperations);
}

export type ExtractOutagesOptions = {
  date?: Date | string;
};

export async function extractOutages(
  imagePath: string,
  { date = new Date() }: ExtractOutagesOptions
) {
  const image = imagePath ?? (await fetchImage(URL));
  const unifiedImage = await normalizeImage(image);
  const tableImage = await extractTableImage(unifiedImage);
  const data = await tableImageToData(tableImage);
  await storeData(data, tableImage.data, unifiedImage.data, date);
}
