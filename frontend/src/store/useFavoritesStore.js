import { create } from 'zustand';

export const useFavoritesStore = create((set, get) => ({
  favorites: [],
  
  loadFavorites: () => {
    const stored = localStorage.getItem('gasolineras-favoritas');
    if (stored) {
      set({ favorites: JSON.parse(stored) });
    }
  },

  addFavorite: (station) => {
    const newFavorites = [...get().favorites, station];
    set({ favorites: newFavorites });
    localStorage.setItem('gasolineras-favoritas', JSON.stringify(newFavorites));
  },

  removeFavorite: (stationId) => {
    const newFavorites = get().favorites.filter((s) => s['IDEESS'] !== stationId);
    set({ favorites: newFavorites });
    localStorage.setItem('gasolineras-favoritas', JSON.stringify(newFavorites));
  },

  isFavorite: (stationId) => {
    return get().favorites.some((s) => s['IDEESS'] === stationId);
  },
}));
