import fetch from 'node-fetch';
import { cache } from '../utils/cache.js';

const MITECO_API_URL = process.env.MITECO_API_URL;
const CACHE_TTL = 3600000;

export async function fetchStationsByProvince(provinceId) {
  const cacheKey = `province_${provinceId}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const url = `${MITECO_API_URL}/EstacionesTerrestres/FiltroProvincia/${provinceId}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MITECO API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(cacheKey, data, CACHE_TTL);

  return data;
}
