import { useState, useEffect } from 'react';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { formatPrice, getDiscountedPrice } from '../../utils/formatters';
import { extractBrand } from '../../utils/brandExtractor';
import { useStore } from '../../store/useStore';
import { useDiscountsStore } from '../../store/useDiscountsStore';

export function FavoritesList() {
  const [isExpanded, setIsExpanded] = useState(false);
  const favorites = useFavoritesStore((state) => state.favorites);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const loadFavorites = useFavoritesStore((state) => state.loadFavorites);
  const selectedFuel = useStore((state) => state.selectedFuel);
  const discounts = useDiscountsStore((state) => state.discounts);

  useEffect(() => {
    loadFavorites();
  }, []);

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className={`absolute bottom-20 right-4 left-4 md:left-auto md:top-4 md:bottom-auto z-10 bg-white rounded-lg shadow-lg md:max-w-xs md:max-h-[calc(100vh-2rem)] mx-auto md:mx-0 transition-all duration-300 ${isExpanded ? 'max-h-[60vh] md:max-h-[calc(100vh-2rem)]' : 'max-h-32'} overflow-hidden`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">Favoritas</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden text-primary-600 text-sm font-medium"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
        <div className={`space-y-3 overflow-y-auto ${isExpanded ? 'max-h-[50vh]' : 'max-h-16'} md:max-h-[calc(100vh-8rem)]`}>
          {favorites.map((station) => {
            const price = station[selectedFuel];
            const brand = extractBrand(station['Rótulo']);
            const discountedPrice = getDiscountedPrice(brand, price, discounts);

            return (
              <div key={station['IDEESS']} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm">{station['Rótulo']}</h4>
                  <button
                    onClick={() => removeFavorite(station['IDEESS'])}
                    className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0"
                    aria-label="Eliminar de favoritas"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-1">{station['Dirección']}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {station['Localidad']}, {station['Provincia']}
                </p>
                {price && (
                  <>
                    {discountedPrice ? (
                      <>
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(price)}
                        </p>
                        <p className="text-sm font-bold text-green-600">
                          {formatPrice(discountedPrice)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-primary-600">
                        {formatPrice(price)}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
