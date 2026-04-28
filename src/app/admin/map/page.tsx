'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Navigation, RefreshCw, Car, Users, Star } from 'lucide-react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ActiveDriver {
  id: string;
  lat: number;
  lng: number;
  lastSeen: string;
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
  activeRide: {
    rideId: string;
    groupId: string;
    flightNumber: string;
    passengers: number;
  } | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Centro default: Sicilia (aeroporto CTA)
const DEFAULT_CENTER = { lng: 15.0664, lat: 37.4667 };

export default function AdminMapPage() {
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [selected, setSelected] = useState<ActiveDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDrivers();
    intervalRef.current = setInterval(fetchDrivers, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/drivers/active', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers ?? []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching active drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = drivers.filter((d) => d.activeRide).length;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div>
              <h1 className="text-white text-xl font-bold flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary-400" />
                Mappa Corse Live
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-gray-300">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                {activeCount} in corsa
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{drivers.length} online</span>
            </div>

            <button
              onClick={fetchDrivers}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Aggiorna"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {lastUpdate && (
              <span className="text-xs text-gray-500">
                Aggiornato {lastUpdate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!MAPBOX_TOKEN ? (
          <div className="flex items-center justify-center h-full text-gray-400 bg-gray-900">
            <div className="text-center">
              <Navigation className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>NEXT_PUBLIC_MAPBOX_TOKEN non configurato</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
              <p>Caricamento mappa...</p>
            </div>
          </div>
        ) : (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: drivers[0]?.lng ?? DEFAULT_CENTER.lng,
              latitude: drivers[0]?.lat ?? DEFAULT_CENTER.lat,
              zoom: 10,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            <NavigationControl position="top-right" />

            {drivers.map((driver) => (
              <Marker
                key={driver.id}
                longitude={driver.lng}
                latitude={driver.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelected(driver);
                }}
              >
                <div
                  className={`cursor-pointer flex items-center justify-center rounded-full shadow-lg border-2 transition-transform hover:scale-110 ${
                    driver.activeRide
                      ? 'w-10 h-10 bg-primary-500 border-primary-300'
                      : 'w-8 h-8 bg-gray-600 border-gray-400'
                  }`}
                  title={driver.name}
                >
                  <Car
                    className={`${driver.activeRide ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
                  />
                </div>
              </Marker>
            ))}

            {selected && (
              <Popup
                longitude={selected.lng}
                latitude={selected.lat}
                anchor="bottom"
                onClose={() => setSelected(null)}
                closeOnClick={false}
                className="z-50"
              >
                <div className="p-3 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected.activeRide ? 'bg-primary-500' : 'bg-gray-400'}`}>
                      <Car className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{selected.name}</p>
                      <p className="text-xs text-gray-500">{selected.vehicle} · {selected.plate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-gray-700">{selected.rating.toFixed(1)}</span>
                  </div>

                  {selected.activeRide ? (
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                        In corsa
                      </p>
                      <p className="text-xs text-green-700">Volo {selected.activeRide.flightNumber}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />
                        {selected.activeRide.passengers} passeggeri
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Disponibile · In attesa</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Ultimo aggiornamento: {new Date(selected.lastSeen).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </Popup>
            )}
          </Map>
        )}

        {/* Legend overlay */}
        <div className="absolute bottom-6 left-6 bg-gray-800/90 backdrop-blur rounded-xl p-4 text-sm border border-gray-700">
          <p className="text-gray-300 font-semibold mb-2">Legenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-500 border-2 border-primary-300 rounded-full flex items-center justify-center">
                <Car className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-300 text-xs">Driver in corsa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-600 border-2 border-gray-400 rounded-full flex items-center justify-center">
                <Car className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-gray-300 text-xs">Driver disponibile</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-2">Refresh ogni 15 secondi</p>
        </div>

        {/* Empty state overlay */}
        {!loading && drivers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-800/90 backdrop-blur rounded-xl p-6 text-center border border-gray-700">
              <Car className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-white font-semibold">Nessun driver online</p>
              <p className="text-gray-400 text-sm mt-1">I driver appaiono qui quando sono attivi</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
