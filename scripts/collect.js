import 'dotenv/config';
import { collectPrices } from '../shared/priceCollector.js';

const source = process.env.COLLECT_SOURCE || (process.env.GITHUB_ACTIONS ? 'github' : 'manual');

console.log(`Running price collection (source=${source})...`);
const result = await collectPrices(source);
console.log('Done!', result);
