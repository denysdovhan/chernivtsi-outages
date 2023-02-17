import { extractOutages } from './index.js';

extractOutages().catch((err) => {
  console.error('Unable to extract outages from the image');
  console.error(err);
  process.exit(1);
});
