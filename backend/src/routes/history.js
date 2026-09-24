import express from 'express';
import { initDatabase, getStationHistory, getStation } from '../../../shared/db.js';

const router = express.Router();

router.get('/:id/history', async (req, res) => {
  try {
    await initDatabase();

    const { id } = req.params;
    const { fuelType, days } = req.query;

    const daysNum = days ? parseInt(days) : null;
    const history = await getStationHistory(id, fuelType || null, daysNum);
    const station = await getStation(id);

    res.json({ station, history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

export default router;
