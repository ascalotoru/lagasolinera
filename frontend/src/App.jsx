import { MapView } from './components/Map/MapView';
import { FuelTypeFilter } from './components/Filters/FuelTypeFilter';
import { NearbyStations } from './components/Sidebar/NearbyStations';
import { FavoritesList } from './components/Sidebar/FavoritesList';
import { DiscountPanel } from './components/Sidebar/DiscountPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useStore } from './store/useStore';
import { useFavoritesStore } from './store/useFavoritesStore';
import { useDiscountsStore } from './store/useDiscountsStore';
import { useEffect, useState } from 'react';

function App() {
  const { location, error, loading } = useGeolocation();
  const storeLoading = useStore((state) => state.loading);
  const storeError = useStore((state) => state.error);
  const stations = useStore((state) => state.stations);
  const loadFavorites = useFavoritesStore((state) => state.loadFavorites);
  const loadDiscounts = useDiscountsStore((state) => state.loadDiscounts);
  const [discountPanelOpen, setDiscountPanelOpen] = useState(false);

  const allStations = Array.from(stations.values()).flat();

  useEffect(() => {
    loadFavorites();
    loadDiscounts();
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <MapView userLocation={location} />
      <FuelTypeFilter />
      <NearbyStations stations={allStations} location={location} />
      <FavoritesList />
      <DiscountPanel isOpen={discountPanelOpen} onClose={() => setDiscountPanelOpen(false)} />

      <button
        onClick={() => setDiscountPanelOpen(true)}
        className="absolute bottom-4 right-4 z-10 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-700 transition-colors text-sm md:text-base"
      >
        Descuentos
      </button>

      {(loading || storeLoading) && (
        <div className="absolute bottom-20 left-4 right-4 md:bottom-4 md:left-4 md:right-auto z-10 bg-white rounded-lg shadow-lg px-4 py-2 mx-auto md:mx-0 max-w-xs">
          <p className="text-sm text-gray-600">
            {loading ? 'Obteniendo ubicación...' : 'Cargando gasolineras...'}
          </p>
        </div>
      )}

      {(error || storeError) && (
        <div className="absolute bottom-20 left-4 right-4 md:bottom-4 md:left-4 md:right-auto z-10 bg-red-50 border border-red-200 rounded-lg shadow-lg px-4 py-2 mx-auto md:mx-0 max-w-xs">
          <p className="text-sm text-red-600">{error || storeError}</p>
        </div>
      )}
    </div>
  );
}

export default App;
