import { useStore } from '../../store/useStore';

const FUEL_OPTIONS = [
  { value: 'Precio Gasolina 95 E5', label: 'G95' },
  { value: 'Precio Gasolina 98 E5', label: 'G98' },
  { value: 'Precio Gasoleo A', label: 'Diésel' },
  { value: 'Precio Gasoleo Premium', label: 'Diésel+' },
  { value: 'Precio Gases licuados del petróleo', label: 'GLP' },
];

const FUEL_OPTIONS_FULL = [
  { value: 'Precio Gasolina 95 E5', label: 'Gasolina 95 E5' },
  { value: 'Precio Gasolina 98 E5', label: 'Gasolina 98 E5' },
  { value: 'Precio Gasoleo A', label: 'Diésel A' },
  { value: 'Precio Gasoleo Premium', label: 'Diésel Premium' },
  { value: 'Precio Gases licuados del petróleo', label: 'GLP' },
];

export function FuelTypeFilter() {
  const selectedFuel = useStore((state) => state.selectedFuel);
  const setSelectedFuel = useStore((state) => state.setSelectedFuel);

  return (
    <>
      {/* Mobile: Compact selector */}
      <div className="absolute top-4 left-4 right-4 md:hidden z-10">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex gap-2 overflow-x-auto">
            {FUEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedFuel(option.value)}
                className={`px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors ${
                  selectedFuel === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Full selector */}
      <div className="hidden md:block absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de combustible
        </label>
        <select
          value={selectedFuel}
          onChange={(e) => setSelectedFuel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {FUEL_OPTIONS_FULL.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
