export async function fetchStationsByProvince(provinceId) {
  const response = await fetch(`/api/stations/province/${provinceId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stations for province ${provinceId}`);
  }

  return response.json();
}
