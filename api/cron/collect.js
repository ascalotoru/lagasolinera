import { collectPrices } from '../../../shared/priceCollector.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await collectPrices();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Cron collect error:', error);
    res.status(500).json({ error: 'Failed to collect prices' });
  }
}
