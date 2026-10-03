import {
  initDatabase,
  upsertStationsBatch,
  insertPriceHistoryBatch,
  startCollectionLog,
  updateCollectionLog,
  finishCollectionLog,
  markStaleCollectionLogs,
} from './db.js';

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

export async function collectPrices(source = 'unknown') {
  console.log('[Collector] Starting price collection...');
  await initDatabase();
  await markStaleCollectionLogs();

  const { id: logId } = await startCollectionLog(source);
  const t0 = Date.now();

  try {
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

    console.log(`[Collector] Fetched ${stations.length} stations in ${fetchMs}ms`);

    const validStations = stations.filter((s) => s['IDEESS']);
    await updateCollectionLog(logId, { phase: 'fetched', fetch_ms: fetchMs });

    const tStations = Date.now();
    await upsertStationsBatch(validStations);
    const stationsMs = Date.now() - tStations;

    await updateCollectionLog(logId, {
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

    console.log(`[Collector] Inserting ${prices.length} prices...`);
    const tPrices = Date.now();
    await insertPriceHistoryBatch(prices);
    const pricesMs = Date.now() - tPrices;

    await updateCollectionLog(logId, { prices_ms: pricesMs });
    await finishCollectionLog(logId, {
      status: 'success',
      phase: 'completed',
      stations: validStations.length,
      prices: prices.length,
      durationMs: Date.now() - t0,
    });

    console.log(`[Collector] Done. ${validStations.length} stations, ${prices.length} prices stored.`);
    return { stations: validStations.length, prices: prices.length, fetchMs, stationsMs, pricesMs };
  } catch (error) {
    console.error(`[Collector] Error (log #${logId}):`, error);
    await finishCollectionLog(logId, {
      status: 'error',
      durationMs: Date.now() - t0,
      error: error.message,
    });
    throw error;
  }
}
