import express from 'express';
import cron from 'node-cron';
import { collectPrices } from '../../../shared/priceCollector.js';
import { initDatabase, getRecentCollectionLogs } from '../../../shared/db.js';

const router = express.Router();

router.post('/collect', async (req, res) => {
  try {
    const result = await collectPrices('backend');
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Cron collect error:', error);
    res.status(500).json({ error: 'Failed to collect prices', message: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    await initDatabase();
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = await getRecentCollectionLogs(limit);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching collection logs:', error);
    res.status(500).json({ error: 'Failed to fetch collection logs' });
  }
});

export function startCronScheduler() {
  initDatabase();

  cron.schedule('0 */8 * * *', async () => {
    console.log('[Cron] Running scheduled price collection...');
    try {
      await collectPrices('cron');
    } catch (error) {
      console.error('[Cron] Error:', error);
    }
  });

  console.log('[Cron] Scheduler started (every 8 hours)');
}

export default router;
