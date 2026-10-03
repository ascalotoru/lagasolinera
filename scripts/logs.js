import 'dotenv/config';
import { initDatabase, getRecentCollectionLogs } from '../shared/db.js';

const limit = parseInt(process.argv[2]) || 20;

await initDatabase();
const logs = await getRecentCollectionLogs(limit);

if (logs.length === 0) {
  console.log('No collection logs.');
} else {
  for (const log of logs) {
    const parts = [
      `#${log.id}`,
      log.started_at,
      `status=${log.status}`,
      `phase=${log.phase ?? '-'}`,
      `source=${log.source ?? '-'}`,
      `stations=${log.stations ?? '-'}`,
      `prices=${log.prices ?? '-'}`,
      `total=${log.duration_ms ?? '-'}ms`,
      `fetch=${log.fetch_ms ?? '-'}ms`,
      `stationsT=${log.stations_ms ?? '-'}ms`,
      `pricesT=${log.prices_ms ?? '-'}ms`,
    ];
    if (log.finished_at) parts.push(`finished=${log.finished_at}`);
    if (log.error) parts.push(`error="${log.error}"`);
    console.log(parts.join(' | '));
  }
}
