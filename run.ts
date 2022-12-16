import minimist from 'minimist';
import { extractOutages, ExtractOutagesOptions } from './index';

async function run() {
  const { _: args, ...flags } = minimist<ExtractOutagesOptions>(
    process.argv.slice(2)
  );
  extractOutages(args[0], flags);
}

run().catch((err) => {
  console.error('Unable to extract outages from the image');
  console.error(err);
  process.exit(1);
});
