'use client';

import { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import { Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import { Card } from './ui';
import 'mapbox-gl/dist/mapbox-gl.css';

interface TrackingMapProps {
  currentLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  route?: Array<{ lat: number; lng: number }>;
}

export default function TrackingMap({ currentLocation, destination, route }: TrackingMapProps) {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: currentLocation.lng,
    latitude: currentLocation.lat,
    zoom: 12
  });

  // Calcola il centro tra posizione attuale e destinazione
  useEffect(() => {
    if (currentLocation && destination) {
      const centerLng = (currentLocation.lng + destination.lng) / 2;
      const centerLat = (currentLocation.lat + destination.lat) / 2;
      
      setViewState({
        longitude: centerLng,
        latitude: centerLat,
        zoom: 11
      });
    }
  }, [currentLocation, destination]);

  // ✅ FIX: GeoJSON con literal types 'as const'
  const routeGeoJSON = route && route.length > 1 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: route.map(point => [point.lng, point.lat])
    }
  } : null;

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibHMtZmxhbnZvIiwiYSI6ImNtZzI1cTVxbzBwaGEycXF3bWV5dHozZTYifQ.c1Vys9aYtGHK6UW4LkHK4A';

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="relative w-full h-96">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Controlli di navigazione con colori corretti */}
          <NavigationControl 
            position="top-right" 
            style={{ 
              top: 10, 
              right: 10 
            }}
          />

          {/* Linea del percorso */}
          {routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': '#4DB8AC',
                  'line-width': 4,
                  'line-dasharray': [2, 2]
                }}
              />
            </Source>
          )}

          {/* Marker Veicolo (posizione attuale) */}
          <Marker
            longitude={currentLocation.lng}
            latitude={currentLocation.lat}
            anchor="center"
          >
            <div className="relative">
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-primary-500 rounded-full opacity-30 animate-ping"></div>
              {/* Icona veicolo */}
              <div className="relative bg-primary-500 rounded-full p-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
            </div>
          </Marker>

          {/* Marker Destinazione */}
          <Marker
            longitude={destination.lng}
            latitude={destination.lat}
            anchor="bottom"
          >
            <div className="relative">
              {/* Pin destinazione */}
              <svg className="w-10 h-10 drop-shadow-lg" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#5B4FFF"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </div>
          </Marker>
        </Map>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span className="font-medium text-gray-900">Veicolo in movimento</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
              <span className="font-medium text-gray-900">Destinazione</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stili personalizzati per i controlli Mapbox */}
      <style jsx global>{`
        .mapboxgl-ctrl-group button {
          background-color: white !important;
          color: #1a1a1a !important;
        }
        
        .mapboxgl-ctrl-group button:hover {
          background-color: #f3f4f6 !important;
        }
        
        .mapboxgl-ctrl-icon {
          filter: invert(0) !important;
        }
        
        .mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon,
        .mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon,
        .mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
          background-color: transparent !important;
        }
      `}</style>
    </Card>
  );
}