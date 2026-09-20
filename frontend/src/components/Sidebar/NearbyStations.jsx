import { useState } from 'react';
import { calculateDistance } from '../../utils/distance';
import { formatPrice, formatDistance, getDiscountedPrice } from '../../utils/formatters';
import { extractBrand } from '../../utils/brandExtractor';
import { useStore } from '../../store/useStore';
import { useDiscountsStore } from '../../store/useDiscountsStore';

export function NearbyStations({ stations, location }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedFuel = useStore((state) => state.selectedFuel);
  const discounts = useDiscountsStore((state) => state.discounts);

  if (!location) return null;

  const stationsWithDistance = stations
    .filter((s) => s['Latitud'] && s['Longitud (WGS84)'] && s[selectedFuel])
    .map((station) => {
      const lat = parseFloat(station['Latitud'].replace(',', '.'));
      const lng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
      const distance = calculateDistance(location.lat, location.lng, lat, lng);
      return { ...station, distance, lat, lng };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  if (stationsWithDistance.length === 0) {
    return (
      <div className="absolute bottom-20 left-4 right-4 md:top-4 md:left-4 md:right-auto md:bottom-auto z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs mx-auto md:mx-0">
        <p className="text-sm text-gray-600">No hay gasolineras cercanas con este combustible</p>
      </div>
    );
  }

  return (
    <div className={`absolute bottom-20 left-4 right-4 md:top-4 md:left-4 md:right-auto md:bottom-auto z-10 bg-white rounded-lg shadow-lg md:max-w-xs md:max-h-[calc(100vh-2rem)] mx-auto md:mx-0 transition-all duration-300 ${isExpanded ? 'max-h-[60vh] md:max-h-[calc(100vh-2rem)]' : 'max-h-32'} overflow-hidden`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">Más cercanas</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden text-primary-600 text-sm font-medium"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
        <div className={`space-y-3 overflow-y-auto ${isExpanded ? 'max-h-[50vh]' : 'max-h-16'} md:max-h-[calc(100vh-8rem)]`}>
          {stationsWithDistance.map((station, index) => {
            const price = station[selectedFuel];
            const brand = extractBrand(station['Rótulo']);
            const discountedPrice = getDiscountedPrice(brand, price, discounts);

            return (
              <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm">{station['Rótulo']}</h4>
                  <span className="text-xs text-gray-500">{formatDistance(station.distance)}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{station['Dirección']}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {station['Localidad']}, {station['Provincia']}
                </p>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
