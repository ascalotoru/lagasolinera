import { useState, useEffect } from 'react';
import { useDiscountsStore } from '../../store/useDiscountsStore';
import { useStore } from '../../store/useStore';
import { extractBrand } from '../../utils/brandExtractor';

export function DiscountPanel({ isOpen, onClose }) {
  const discounts = useDiscountsStore((state) => state.discounts);
  const setDiscount = useDiscountsStore((state) => state.setDiscount);
  const removeDiscount = useDiscountsStore((state) => state.removeDiscount);
  const stations = useStore((state) => state.stations);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [discountType, setDiscountType] = useState('cents');
  const [discountValue, setDiscountValue] = useState('');

  const allStations = Array.from(stations.values()).flat();
  const brands = [...new Set(allStations.map((s) => extractBrand(s['Rótulo'])))].sort();

  useEffect(() => {
    if (selectedBrand && discounts[selectedBrand]) {
      setDiscountType(discounts[selectedBrand].type);
      setDiscountValue(discounts[selectedBrand].value);
    } else {
      setDiscountType('cents');
      setDiscountValue('');
    }
  }, [selectedBrand]);

  const handleSave = () => {
    if (!selectedBrand || !discountValue) return;
    setDiscount(selectedBrand, discountType, parseFloat(discountValue));
    setSelectedBrand('');
    setDiscountValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Descuentos por marca</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marca
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
          >
            <option value="">Selecciona una marca</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          {selectedBrand && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de descuento
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cents"
                    checked={discountType === 'cents'}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="mr-2"
                  />
                  Céntimos
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="percent"
                    checked={discountType === 'percent'}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="mr-2"
                  />
                  Porcentaje
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor
              </label>
              <input
                type="number"
                step="0.001"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'cents' ? 'Ej: 5' : 'Ej: 3'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              />

              <button
                onClick={handleSave}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Guardar descuento
              </button>
            </>
          )}
        </div>

        {Object.keys(discounts).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Descuentos activos</h3>
            <div className="space-y-2">
              {Object.entries(discounts).map(([brand, discount]) => (
                <div
                  key={brand}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{brand}</p>
                    <p className="text-sm text-gray-600">
                      {discount.type === 'cents'
                        ? `-${discount.value} céntimos`
                        : `-${discount.value}%`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDiscount(brand)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
