export function ClusterMarker({ feature, onClick }) {
  const { point_count } = feature.properties;
  const size = point_count < 10 ? 30 : point_count < 50 ? 40 : 50;

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: point_count < 10 ? '#10b981' : point_count < 50 ? '#f59e0b' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        border: '3px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      {point_count}
    </div>
  );
}
