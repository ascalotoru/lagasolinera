import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchStationsByProvince } from '../services/api';
import { useMapProvinces } from './useMapProvinces';

export function useGasStations(map) {
  const provinces = useMapProvinces(map);
  const stations = useStore((state) => state.stations);
  const setStations = useStore((state) => state.setStations);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);

  useEffect(() => {
    const loadStations = async () => {
      const provincesToLoad = provinces.filter((id) => !stations.has(id));

      if (provincesToLoad.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        await Promise.all(
          provincesToLoad.map(async (provinceId) => {
            const data = await fetchStationsByProvince(provinceId);
            setStations(provinceId, data.ListaEESSPrecio || []);
          })
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [provinces, stations, setStations, setLoading, setError]);

  const allStations = Array.from(stations.values()).flat();
  return allStations;
}
