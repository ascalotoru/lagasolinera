import { createClient } from '@libsql/client';

const MITECO_API_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes';

const FUEL_FIELDS = [
  'Precio Gasolina 95 E5',
  'Precio Gasolina 95 E10',
  'Precio Gasolina 95 E25',
  'Precio Gasolina 95 E85',
  'Precio Gasolina 95 E5 Premium',
  'Precio Gasolina 98 E5',
  'Precio Gasolina 98 E10',
  'Precio Gasoleo A',
  'Precio Gasoleo Premium',
  'Precio Gasoleo B',
  'Precio Gases licuados del petróleo',
  'Precio Gas Natural Comprimido',
  'Precio Gas Natural Licuado',
  'Precio Biodiesel',
  'Precio Bioetanol',
  'Precio Biogas Natural Comprimido',
  'Precio Biogas Natural Licuado',
  'Precio Diésel Renovable',
  'Precio Gasolina Renovable',
  'Precio Hidrogeno',
  'Precio Metanol',
  'Precio Adblue',
  'Precio Amoniaco',
];

async function initDatabase(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS stations (
      station_id TEXT PRIMARY KEY,
      label TEXT,
      address TEXT,
      locality TEXT,
      province TEXT,
      latitude REAL,
      longitude REAL,
      updated_at TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS price_history (
      station_id TEXT,
      fuel_type TEXT,
      price REAL,
      created_at TEXT
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_price_history_station_fuel_date
    ON price_history (station_id, fuel_type, created_at)
  `);
}

async function upsertStationsBatch(client, stations) {
  const updatedAt = new Date().toISOString();
  const batch = stations.map((station) => {
    const stationId = station['IDEESS'];
    const label = station['Rótulo'];
    const address = station['Dirección'];
    const locality = station['Localidad'];
    const province = station['Provincia'];
    const latitude = parseFloat(station['Latitud']?.replace(',', '.') || 0);
    const longitude = parseFloat(station['Longitud (WGS84)']?.replace(',', '.') || 0);

    return {
      sql: `
        INSERT INTO stations (station_id, label, address, locality, province, latitude, longitude, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(station_id) DO UPDATE SET
          label = excluded.label,
          address = excluded.address,
          locality = excluded.locality,
          province = excluded.province,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          updated_at = excluded.updated_at
      `,
      args: [stationId, label, address, locality, province, latitude, longitude, updatedAt],
    };
  });

  await client.batch(batch, 'write');
}

async function insertPriceHistoryBatch(client, prices) {
  const createdAt = new Date().toISOString();
  const batch = prices.map(({ stationId, fuelType, price }) => ({
    sql: `
      INSERT INTO price_history (station_id, fuel_type, price, created_at)
      VALUES (?, ?, ?, ?)
    `,
    args: [stationId, fuelType, price, createdAt],
  }));

  await client.batch(batch, 'write');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

    console.log('[Collector] Starting price collection...');
    await initDatabase(client);

    const url = `${MITECO_API_URL}/EstacionesTerrestres`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`MITECO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const stations = data.ListaEESSPrecio || [];

    console.log(`[Collector] Fetched ${stations.length} stations`);

    const validStations = stations.filter((s) => s['IDEESS']);
    await upsertStationsBatch(client, validStations);

    const prices = [];
    for (const station of validStations) {
      const stationId = station['IDEESS'];

      for (const fuelField of FUEL_FIELDS) {
        const priceStr = station[fuelField];
        if (!priceStr || priceStr === '') continue;

        const price = parseFloat(priceStr.replace(',', '.'));
        if (isNaN(price)) continue;

        prices.push({ stationId, fuelType: fuelField, price });
      }
    }

    console.log(`[Collector] Inserting ${prices.length} prices...`);
    await insertPriceHistoryBatch(client, prices);

    console.log(`[Collector] Done. ${validStations.length} stations, ${prices.length} prices stored.`);
    
    res.status(200).json({ 
      success: true, 
      stations: validStations.length, 
      prices: prices.length 
    });
  } catch (error) {
    console.error('Cron collect error:', error);
    res.status(500).json({ error: 'Failed to collect prices', message: error.message });
  }
}
