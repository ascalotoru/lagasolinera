import provincesData from '../data/provinces.json';

export function getProvincesForViewport(bounds) {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const centerLng = (ne.lng + sw.lng) / 2;
  const centerLat = (ne.lat + sw.lat) / 2;

  let closestProvince = null;
  let minDistance = Infinity;

  for (const [id, province] of Object.entries(provincesData)) {
    const [lng, lat] = province.center;
    const distance = Math.sqrt(
      Math.pow(lng - centerLng, 2) + Math.pow(lat - centerLat, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestProvince = id;
    }
  }

  if (!closestProvince) return [];

  const province = provincesData[closestProvince];
  const result = [closestProvince, ...province.adjacent];

  return [...new Set(result)];
}

export function getProvinceName(provinceId) {
  return provincesData[provinceId]?.name || provinceId;
}
