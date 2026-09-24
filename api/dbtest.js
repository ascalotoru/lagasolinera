import { createClient } from '@libsql/client';

export default async function handler(req, res) {
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const result = await client.execute('SELECT COUNT(*) as count FROM stations');
    
    res.status(200).json({
      success: true,
      count: result.rows[0].count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
