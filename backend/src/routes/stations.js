import express from 'express';
import { fetchStationsByProvince } from '../services/mitecoClient.js';

const router = express.Router();

router.get('/province/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchStationsByProvince(id);
    res.json(data);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

export default router;
