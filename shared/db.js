import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let client;

if (process.env.TURSO_DATABASE_URL) {
  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  const dbPath = join(__dirname, '..', 'local.db');
  client = createClient({
    url: `file:${dbPath}`,
  });
}

export async function initDatabase() {
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

export async function startCollectionLog(source = 'unknown') {
  const startedAt = new Date().toISOString();
  const result = await client.execute({
    sql: `INSERT INTO collection_logs (started_at, status, source) VALUES (?, 'running', ?)`,
    args: [startedAt, source],
  });
  return { id: Number(result.lastInsertRowid), startedAt };
}

export async function updateCollectionLog(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const args = keys.map((k) => fields[k]);
  await client.execute({
    sql: `UPDATE collection_logs SET ${sets} WHERE id = ?`,
    args: [...args, id],
  });
}

export async function finishCollectionLog(id, { status, phase, stations, prices, durationMs, error }) {
  await updateCollectionLog(id, {
    status,
    phase: phase ?? null,
    stations: stations ?? null,
    prices: prices ?? null,
    duration_ms: durationMs ?? null,
    finished_at: new Date().toISOString(),
    error: error ?? null,
  });
}

export async function markStaleCollectionLogs(timeoutMs = 15 * 60 * 1000) {
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

export async function getRecentCollectionLogs(limit = 50) {
  const result = await client.execute({
    sql: 'SELECT * FROM collection_logs ORDER BY id DESC LIMIT ?',
    args: [limit],
  });
  return result.rows;
}

export async function upsertStationsBatch(stations) {
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

export async function insertPriceHistoryBatch(prices) {
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

export async function getStationHistory(stationId, fuelType = null, days = null) {
  let sql = `
    SELECT station_id, fuel_type, price, created_at
    FROM price_history
    WHERE station_id = ?
  `;
  const args = [stationId];

  if (fuelType) {
    sql += ' AND fuel_type = ?';
    args.push(fuelType);
  }

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    sql += ' AND created_at >= ?';
    args.push(startDate.toISOString());
  }

  sql += ' ORDER BY created_at ASC';

  const result = await client.execute({ sql, args });
  return result.rows;
}

export async function getStation(stationId) {
  const result = await client.execute({
    sql: 'SELECT * FROM stations WHERE station_id = ?',
    args: [stationId],
  });
  return result.rows[0];
}

export { client };
