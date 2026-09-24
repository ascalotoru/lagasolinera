import { createClient } from '@libsql/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error('TURSO_DATABASE_URL not configured');
    }

    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const { id } = req.query;
    const { fuelType, days } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Station ID required' });
    }

    let sql = `
      SELECT station_id, fuel_type, price, created_at
      FROM price_history
      WHERE station_id = ?
    `;
    const args = [id];

    if (fuelType) {
      sql += ' AND fuel_type = ?';
      args.push(fuelType);
    }

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      sql += ' AND created_at >= ?';
      args.push(startDate.toISOString());
    }

    sql += ' ORDER BY created_at ASC';

    const historyResult = await client.execute({ sql, args });
    const stationResult = await client.execute({
      sql: 'SELECT * FROM stations WHERE station_id = ?',
      args: [id],
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json({ 
      station: stationResult.rows[0], 
      history: historyResult.rows 
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price history',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
