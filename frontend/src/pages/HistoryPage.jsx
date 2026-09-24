import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { fetchStationHistory } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const FUEL_COLORS = {
  'Precio Gasolina 95 E5': '#3b82f6',
  'Precio Gasolina 98 E5': '#ef4444',
  'Precio Gasoleo A': '#10b981',
  'Precio Gasoleo Premium': '#f59e0b',
  'Precio Gases licuados del petróleo': '#8b5cf6',
};

const FUEL_LABELS = {
  'Precio Gasolina 95 E5': 'Gasolina 95',
  'Precio Gasolina 98 E5': 'Gasolina 98',
  'Precio Gasoleo A': 'Diésel A',
  'Precio Gasoleo Premium': 'Diésel Premium',
  'Precio Gases licuados del petróleo': 'GLP',
};

const RANGE_OPTIONS = [
  { label: '7 días', value: '7' },
  { label: '30 días', value: '30' },
  { label: '90 días', value: '90' },
  { label: 'Todo', value: '' },
];

export function HistoryPage() {
  const { stationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = searchParams.get('days') ?? '';

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchStationHistory(stationId, days || null);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stationId, days]);

  const handleRangeChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('days', value);
    } else {
      params.delete('days');
    }
    setSearchParams(params);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando histórico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  const { station, history } = data;

  if (!history || history.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="text-2xl font-bold mb-2">{station?.label || 'Gasolinera'}</h1>
        <p className="text-gray-600">Aún no hay datos históricos disponibles.</p>
        <p className="text-sm text-gray-500 mt-2">Los datos se recogen cada 8 horas.</p>
      </div>
    );
  }

  const fuelTypes = [...new Set(history.map((h) => h.fuel_type))];

  const datasets = fuelTypes.map((fuelType) => {
    const fuelHistory = history.filter((h) => h.fuel_type === fuelType);
    return {
      label: FUEL_LABELS[fuelType] || fuelType,
      data: fuelHistory.map((h) => ({
        x: new Date(h.created_at),
        y: h.price,
      })),
      borderColor: FUEL_COLORS[fuelType] || '#6b7280',
      backgroundColor: FUEL_COLORS[fuelType] || '#6b7280',
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    };
  });

  const chartData = { datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolución de precios',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(3)} €/L`,
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'dd/MM/yyyy HH:mm',
          displayFormats: {
            day: 'dd/MM',
            week: 'dd/MM',
            month: 'MM/yyyy',
          },
        },
        title: {
          display: true,
          text: 'Fecha',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Precio (€/L)',
        },
        ticks: {
          callback: (value) => `${value.toFixed(3)} €`,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {station?.label || 'Gasolinera'}
          </h1>
          {station && (
            <p className="text-gray-600 text-sm mt-1">
              {station.address}, {station.locality}, {station.province}
            </p>
          )}
        </div>

        <div className="mb-4 flex gap-2 flex-wrap">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleRangeChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6" style={{ height: '500px' }}>
          <Line data={chartData} options={options} />
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3">Últimos registros</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Fecha</th>
                  <th className="text-left py-2 px-3">Combustible</th>
                  <th className="text-right py-2 px-3">Precio</th>
                </tr>
              </thead>
              <tbody>
                {history
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-600">
                        {new Date(record.created_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 px-3">
                        {FUEL_LABELS[record.fuel_type] || record.fuel_type}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {record.price.toFixed(3)} €/L
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
