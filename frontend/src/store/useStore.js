import { create } from 'zustand';

export const useStore = create((set, get) => ({
  stations: new Map(),
  selectedFuel: 'Precio Gasolina 95 E5',
  loading: false,
  error: null,

  setStations: (provinceId, stations) =>
    set((state) => ({
      stations: new Map(state.stations).set(provinceId, stations),
    })),

  setSelectedFuel: (fuel) => set({ selectedFuel: fuel }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  getAllStations: () => {
    const stations = get().stations;
    return Array.from(stations.values()).flat();
  },
}));
