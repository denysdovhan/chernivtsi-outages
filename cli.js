#!/usr/bin/env node

import meow from 'meow';
import { extractOutages } from './index.mjs';

const cli = meow(`
  Usage
    $ node cli.js [table-image]
`, {
  importMeta: import.meta,
  flags: {
    date: {
      type: 'string',
      alias: 'd',
      default: (new Date()).toISOString()
    }
  }
});

async function main() {
  try {
    extractOutages(cli.input[0], cli.flags);
  } catch (err) {
    console.error('Unable to extract outages from the image');
    console.error(err);
  }
}

main();