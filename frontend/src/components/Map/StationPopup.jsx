import { formatPrice, getDiscountedPrice } from '../../utils/formatters';
import { extractBrand } from '../../utils/brandExtractor';
import { useStore } from '../../store/useStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useDiscountsStore } from '../../store/useDiscountsStore';

const FUEL_FIELDS = [
  { key: 'Precio Gasolina 95 E5', label: 'Gasolina 95 E5' },
  { key: 'Precio Gasolina 95 E10', label: 'Gasolina 95 E10' },
  { key: 'Precio Gasolina 95 E25', label: 'Gasolina 95 E25' },
  { key: 'Precio Gasolina 95 E85', label: 'Gasolina 95 E85' },
  { key: 'Precio Gasolina 95 E5 Premium', label: 'Gasolina 95 E5 Premium' },
  { key: 'Precio Gasolina 98 E5', label: 'Gasolina 98 E5' },
  { key: 'Precio Gasolina 98 E10', label: 'Gasolina 98 E10' },
  { key: 'Precio Gasoleo A', label: 'Diésel A' },
  { key: 'Precio Gasoleo Premium', label: 'Diésel Premium' },
  { key: 'Precio Gasoleo B', label: 'Diésel B' },
  { key: 'Precio Gases licuados del petróleo', label: 'GLP' },
  { key: 'Precio Gas Natural Comprimido', label: 'GNC' },
  { key: 'Precio Gas Natural Licuado', label: 'GNL' },
  { key: 'Precio Biodiesel', label: 'Biodiésel' },
  { key: 'Precio Bioetanol', label: 'Bioetanol' },
  { key: 'Precio Biogas Natural Comprimido', label: 'Biogás Comprimido' },
  { key: 'Precio Biogas Natural Licuado', label: 'Biogás Licuado' },
  { key: 'Precio Diésel Renovable', label: 'Diésel Renovable' },
  { key: 'Precio Gasolina Renovable', label: 'Gasolina Renovable' },
  { key: 'Precio Hidrogeno', label: 'Hidrógeno' },
  { key: 'Precio Metanol', label: 'Metanol' },
  { key: 'Precio Adblue', label: 'AdBlue' },
  { key: 'Precio Amoniaco', label: 'Amoniaco' },
];

export function StationPopup({ station }) {
  const selectedFuel = useStore((state) => state.selectedFuel);
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const discounts = useDiscountsStore((state) => state.discounts);
  
  const favorite = isFavorite(station['IDEESS']);
  const brand = extractBrand(station['Rótulo']);
  
  const availableFuels = FUEL_FIELDS
    .filter((fuel) => station[fuel.key] && station[fuel.key] !== '')
    .map((fuel) => {
      const price = station[fuel.key];
      const discountedPrice = getDiscountedPrice(brand, price, discounts);
      return { ...fuel, price, discountedPrice };
    });

  const handleFavoriteClick = () => {
    if (favorite) {
      removeFavorite(station['IDEESS']);
    } else {
      addFavorite(station);
    }
  };

  return (
    <div className="w-[300px]">
      <h3 className="font-bold text-lg mb-2 pr-8">{station['Rótulo']}</h3>
      <div className="space-y-1 text-sm">
        <p className="text-gray-600">{station['Dirección']}</p>
        <p className="text-gray-600">
          {station['Localidad']}, {station['Provincia']}
        </p>
        <p className="text-gray-500 text-xs">{station['Horario']}</p>
        
        {availableFuels.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-gray-700 mb-2">Precios</p>
              <button
                onClick={handleFavoriteClick}
                className={`text-2xl ${favorite ? 'text-red-500' : 'text-gray-300'} hover:scale-110 transition-transform`}
                aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                ♥
              </button>
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {availableFuels.map((fuel) => (
                <div key={fuel.key} className="flex justify-between items-start">
                  <span className="text-xs text-gray-600 flex-1">{fuel.label}</span>
                  <div className="text-right ml-2">
                    {fuel.discountedPrice ? (
                      <>
                        <span className="text-xs text-gray-400 line-through block">
                          {formatPrice(fuel.price)}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {formatPrice(fuel.discountedPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-primary-600">
                        {formatPrice(fuel.price)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
