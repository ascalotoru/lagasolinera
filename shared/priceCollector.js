import fetch from 'node-fetch';
import { initDatabase, upsertStationsBatch, insertPriceHistoryBatch } from './db.js';

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

export async function collectPrices() {
  console.log('[Collector] Starting price collection...');
  await initDatabase();

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
  await upsertStationsBatch(validStations);

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
  await insertPriceHistoryBatch(prices);

  console.log(`[Collector] Done. ${validStations.length} stations, ${prices.length} prices stored.`);
  return { stations: validStations.length, prices: prices.length };
}
