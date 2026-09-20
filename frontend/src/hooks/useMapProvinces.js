import { useState, useEffect } from 'react';
import { getProvincesForViewport } from '../utils/provinces';

export function useMapProvinces(map) {
  const [provinces, setProvinces] = useState([]);

  useEffect(() => {
    if (!map) return;

    const updateProvinces = () => {
      const bounds = map.getBounds();
      const newProvinces = getProvincesForViewport(bounds);
      setProvinces(newProvinces);
    };

    updateProvinces();
    map.on('moveend', updateProvinces);

    return () => {
      map.off('moveend', updateProvinces);
    };
  }, [map]);

  return provinces;
}
