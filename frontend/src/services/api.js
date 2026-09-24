export async function fetchStationsByProvince(provinceId) {
  const response = await fetch(`/api/stations/province/${provinceId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stations for province ${provinceId}`);
  }

  return response.json();
}

export async function fetchStationHistory(stationId, days = null) {
  const params = new URLSearchParams();
  if (days) params.set('days', days);

  const url = `/api/stations/${stationId}/history${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch history for station ${stationId}`);
  }

  return response.json();
}
