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
}

async function startCollectionLog(client, source) {
  const result = await client.execute({
    sql: `INSERT INTO collection_logs (started_at, status, source) VALUES (?, 'running', ?)`,
    args: [new Date().toISOString(), source],
  });
  return Number(result.lastInsertRowid);
}

async function updateCollectionLog(client, id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const args = keys.map((k) => fields[k]);
  await client.execute({
    sql: `UPDATE collection_logs SET ${sets} WHERE id = ?`,
    args: [...args, id],
  });
}

async function finishCollectionLog(client, id, { status, phase, stations, prices, durationMs, error }) {
  await updateCollectionLog(client, id, {
    status,
    phase: phase ?? null,
    stations: stations ?? null,
    prices: prices ?? null,
    duration_ms: durationMs ?? null,
    finished_at: new Date().toISOString(),
    error: error ?? null,
  });
}

async function markStaleCollectionLogs(client, timeoutMs = 15 * 60 * 1000) {
  const cutoff = new Date(Date.now() - timeoutMs).toISOString();
  await client.execute({
    sql: `
      UPDATE collection_logs
      SET status = 'timeout', finished_at = ?,
          error = COALESCE(error, 'Sin finalizar (posible timeout de la function)')
      WHERE status = 'running' AND started_at < ?
    `,
    args: [new Date().toISOString(), cutoff],
  });
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

    await initDatabase(client);
    await markStaleCollectionLogs(client);

    const source = process.env.VERCEL ? 'vercel' : 'local';
    const logId = await startCollectionLog(client, source);
    const t0 = Date.now();

    try {
      console.log(`[Collector] Starting price collection (log #${logId})...`);

      const tFetch = Date.now();
      const url = `${MITECO_API_URL}/EstacionesTerrestres`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`MITECO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const stations = data.ListaEESSPrecio || [];
      const fetchMs = Date.now() - tFetch;
      const validStations = stations.filter((s) => s['IDEESS']);

      console.log(`[Collector] Fetched ${stations.length} stations in ${fetchMs}ms`);
      await updateCollectionLog(client, logId, {
        phase: 'fetched',
        fetch_ms: fetchMs,
      });

      const tStations = Date.now();
      await upsertStationsBatch(client, validStations);
      const stationsMs = Date.now() - tStations;

      await updateCollectionLog(client, logId, {
        phase: 'stations_upserted',
        stations_ms: stationsMs,
        stations: validStations.length,
      });

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

      const tPrices = Date.now();
      await insertPriceHistoryBatch(client, prices);
      const pricesMs = Date.now() - tPrices;

      console.log(`[Collector] Inserted ${prices.length} prices in ${pricesMs}ms`);
      await updateCollectionLog(client, logId, { prices_ms: pricesMs });
      await finishCollectionLog(client, logId, {
        status: 'success',
        phase: 'completed',
        stations: validStations.length,
        prices: prices.length,
        durationMs: Date.now() - t0,
      });

      res.status(200).json({
        success: true,
        stations: validStations.length,
        prices: prices.length,
        fetchMs,
        stationsMs,
        pricesMs,
        totalMs: Date.now() - t0,
      });
    } catch (error) {
      console.error(`[Collector] Error (log #${logId}):`, error);
      await finishCollectionLog(client, logId, {
        status: 'error',
        durationMs: Date.now() - t0,
        error: error.message,
      });
      throw error;
    }
  } catch (error) {
    console.error('Cron collect error:', error);
    res.status(500).json({ error: 'Failed to collect prices', message: error.message });
  }
}
