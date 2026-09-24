import { initDatabase, getStationHistory, getStation } from '../../../../shared/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error('TURSO_DATABASE_URL not configured');
    }

    await initDatabase();

    const { id } = req.query;
    const { fuelType, days } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Station ID required' });
    }

    const daysNum = days ? parseInt(days) : null;
    const history = await getStationHistory(id, fuelType || null, daysNum);
    const station = await getStation(id);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json({ station, history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price history',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
