import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';
import { fetchStationsByProvince } from '../../services/api';
import { getProvincesForViewport } from '../../utils/provinces';
import { useStore } from '../../store/useStore';
import { createRoot } from 'react-dom/client';
import { ClusterMarker } from './ClusterMarker';
import { StationMarker } from './StationMarker';
import { StationPopup } from './StationPopup';

export function MapView({ userLocation }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const superclusterRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const loadedProvincesRef = useRef(new Set());
  const loadingRef = useRef(false);
  const updateMarkersRef = useRef(null);

  const selectedFuel = useStore((state) => state.selectedFuel);
  const stations = useStore((state) => state.stations);
  const setStations = useStore((state) => state.setStations);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);

  useEffect(() => {
    if (mapRef.current) return;

    const initialCenter = userLocation 
      ? [userLocation.lng, userLocation.lat]
      : [-3.7038, 40.4168];
    
    const initialZoom = userLocation ? 12 : 6;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: initialCenter,
      zoom: initialZoom,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    mapRef.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !userLocation) return;

    const map = mapRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const element = document.createElement('div');
    element.style.width = '20px';
    element.style.height = '20px';
    element.style.backgroundColor = '#3b82f6';
    element.style.borderRadius = '50%';
    element.style.border = '3px solid white';
    element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    userMarkerRef.current = new maplibregl.Marker({ element })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    // Ejecutar flyTo directamente si el mapa ya está cargado
    if (!map.isMoving()) {
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
        duration: 2000,
      });
    } else {
      map.once('idle', () => {
        map.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 12,
          duration: 2000,
        });
      });
    }
  }, [userLocation, mapReady]);

  const updateMarkers = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const allStations = Array.from(stations.values()).flat();

    if (allStations.length === 0) return;

    const points = allStations
      .filter((s) => s['Latitud'] && s['Longitud (WGS84)'])
      .map((station) => {
        const lat = parseFloat(station['Latitud'].replace(',', '.'));
        const lng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
        return {
          type: 'Feature',
          properties: station,
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        };
      });

    if (!superclusterRef.current) {
      superclusterRef.current = new Supercluster({
        radius: 60,
        maxZoom: 14,
      });
    }

    superclusterRef.current.load(points);

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const clusters = superclusterRef.current.getClusters(bbox, Math.floor(zoom));

    clusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (feature.properties.cluster) {
        const element = document.createElement('div');
        const root = createRoot(element);
        root.render(<ClusterMarker feature={feature} />);

        const marker = new maplibregl.Marker({ element })
          .setLngLat([lng, lat])
          .addTo(map);

        element.addEventListener('click', () => {
          const expansionZoom = superclusterRef.current.getClusterExpansionZoom(
            feature.properties.cluster_id
          );
          map.setZoom(expansionZoom);
          map.setCenter([lng, lat]);
        });

        markersRef.current.push(marker);
      } else {
        const element = document.createElement('div');
        const root = createRoot(element);
        root.render(<StationMarker feature={feature} />);

        const marker = new maplibregl.Marker({ element })
          .setLngLat([lng, lat])
          .addTo(map);

        const popupDiv = document.createElement('div');
        const popupRoot = createRoot(popupDiv);
        popupRoot.render(<StationPopup station={feature.properties} />);

        const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupDiv);
        marker.setPopup(popup);

        markersRef.current.push(marker);
      }
    });
  }, [stations, selectedFuel]);

  useEffect(() => {
    updateMarkersRef.current = updateMarkers;
  }, [updateMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;

    const loadStationsForProvinces = async (provinces) => {
      if (loadingRef.current) return false;

      const provincesToLoad = provinces.filter((id) => !loadedProvincesRef.current.has(id));

      if (provincesToLoad.length === 0) return false;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        await Promise.all(
          provincesToLoad.map(async (provinceId) => {
            const data = await fetchStationsByProvince(provinceId);
            setStations(provinceId, data.ListaEESSPrecio || []);
            loadedProvincesRef.current.add(provinceId);
          })
        );
        return true;
      } catch (error) {
        setError(error.message);
        return false;
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    const handleMoveEnd = async () => {
      const bounds = map.getBounds();
      const provinces = getProvincesForViewport(bounds);
      const loaded = await loadStationsForProvinces(provinces);
      
      // Solo actualizar marcadores si se cargaron nuevas provincias
      if (loaded && updateMarkersRef.current) {
        updateMarkersRef.current();
      }
    };

    const handleZoomEnd = () => {
      // Actualizar marcadores en zoom para clustering
      if (updateMarkersRef.current) {
        updateMarkersRef.current();
      }
    };

    handleMoveEnd();
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    // Actualizar marcadores cuando cambia el combustible seleccionado
    if (updateMarkersRef.current) {
      updateMarkersRef.current();
    }

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [mapReady, selectedFuel, setStations, setLoading, setError]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
  );
}
