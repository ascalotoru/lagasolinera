import express from 'express';
import cron from 'node-cron';
import { collectPrices } from '../../../shared/priceCollector.js';
import { initDatabase } from '../../../shared/db.js';

const router = express.Router();

router.post('/collect', async (req, res) => {
  try {
    const result = await collectPrices();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Cron collect error:', error);
    res.status(500).json({ error: 'Failed to collect prices' });
  }
});

export function startCronScheduler() {
  initDatabase();

  cron.schedule('0 */8 * * *', async () => {
    console.log('[Cron] Running scheduled price collection...');
    try {
      await collectPrices();
    } catch (error) {
      console.error('[Cron] Error:', error);
    }
  });

  console.log('[Cron] Scheduler started (every 8 hours)');
}

export default router;
