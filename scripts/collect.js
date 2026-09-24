import 'dotenv/config';
import { collectPrices } from '../shared/priceCollector.js';

console.log('Running initial price collection...');
const result = await collectPrices();
console.log('Done!', result);
