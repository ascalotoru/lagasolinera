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

    await client.execute(`
      CREATE TABLE IF NOT EXISTS collection_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        status TEXT NOT NULL,
        phase TEXT,
        source TEXT,
        stations INTEGER,
        prices INTEGER,
        duration_ms INTEGER,
        fetch_ms INTEGER,
        stations_ms INTEGER,
        prices_ms INTEGER,
        error TEXT
      )
    `);

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const result = await client.execute({
      sql: 'SELECT * FROM collection_logs ORDER BY id DESC LIMIT ?',
      args: [limit],
    });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching collection logs:', error);
    res.status(500).json({ error: 'Failed to fetch collection logs', message: error.message });
  }
}
