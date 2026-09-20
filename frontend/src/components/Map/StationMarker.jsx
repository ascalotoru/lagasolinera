import { useStore } from '../../store/useStore';

export function StationMarker({ feature, onClick }) {
  const station = feature.properties;
  const selectedFuel = useStore((state) => state.selectedFuel);
  const price = station[selectedFuel];

  return (
    <div
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        border: '3px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        cursor: 'pointer',
      }}
      title={price ? `${price} €/L` : 'Sin precio'}
    />
  );
}
