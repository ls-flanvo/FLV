'use client';

import { useState, useEffect, useRef } from 'react';
import Map, { MapRef } from 'react-map-gl';
import { Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import { Card } from './ui';
import 'mapbox-gl/dist/mapbox-gl.css';

interface TrackingMapProps {
  currentLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  route?: Array<{ lat: number; lng: number }>;
}

export default function TrackingMap({ currentLocation, destination, route }: TrackingMapProps) {
  const mapRef = useRef<MapRef>(null);
  const prevLocation = useRef(currentLocation);

  const [viewState, setViewState] = useState({
    longitude: (currentLocation.lng + destination.lng) / 2,
    latitude: (currentLocation.lat + destination.lat) / 2,
    zoom: 11,
  });

  // Anima il marker quando la posizione del driver cambia
  useEffect(() => {
    const prev = prevLocation.current;
    const moved =
      Math.abs(prev.lat - currentLocation.lat) > 0.0001 ||
      Math.abs(prev.lng - currentLocation.lng) > 0.0001;

    if (moved && mapRef.current) {
      mapRef.current.easeTo({
        center: [
          (currentLocation.lng + destination.lng) / 2,
          (currentLocation.lat + destination.lat) / 2,
        ],
        duration: 1500,
        easing: (t) => t * (2 - t), // ease-out
      });
      prevLocation.current = currentLocation;
    }
  }, [currentLocation, destination]);

  const routeGeoJSON = route && route.length > 1
    ? {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: route.map(p => [p.lng, p.lat]),
        },
      }
    : null;

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="relative w-full h-96">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />

          {routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-line"
                type="line"
                paint={{ 'line-color': '#00D1B2', 'line-width': 4, 'line-dasharray': [2, 2] }}
              />
            </Source>
          )}

          {/* Driver marker con pulse */}
          <Marker longitude={currentLocation.lng} latitude={currentLocation.lat} anchor="center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500 rounded-full opacity-30 animate-ping" />
              <div className="relative bg-primary-500 rounded-full p-2.5 shadow-lg border-2 border-white">
                <svg className="w-5 h-5 text-[#0B0B0B]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
            </div>
          </Marker>

          {/* Destinazione marker */}
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div>
              <svg className="w-9 h-9 drop-shadow-lg" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#00D1B2" stroke="white" strokeWidth="1.5" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </div>
          </Marker>
        </Map>

        {/* Overlay info */}
        <div className="absolute bottom-3 left-3 right-3 bg-[#0B0B0B]/90 backdrop-blur-sm rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white">Driver in movimento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-400 rounded-full" />
            <span className="text-xs text-ink-secondary">Destinazione</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
