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
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Header */}
      <div className="bg-surface-1 border-b border-surface-4 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-ink-muted hover:text-white flex items-center gap-1 text-sm"
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
              <span className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-success">{activeCount} in corsa</span>
              </span>
              <span className="text-ink-muted text-xs">{drivers.length} online</span>
            </div>

            <button
              onClick={fetchDrivers}
              className="text-ink-muted hover:text-white p-2 rounded-lg hover:bg-surface-3 transition-colors"
              title="Aggiorna"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {lastUpdate && (
              <span className="text-xs text-ink-muted">
                {lastUpdate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!MAPBOX_TOKEN ? (
          <div className="flex items-center justify-center h-full text-ink-muted bg-[#0B0B0B]">
            <div className="text-center">
              <Navigation className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>NEXT_PUBLIC_MAPBOX_TOKEN non configurato</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full bg-[#0B0B0B]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
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
                      : 'w-8 h-8 bg-surface-4 border-surface-5'
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
                <div className="p-3 min-w-[180px] bg-surface-1 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected.activeRide ? 'bg-primary-500' : 'bg-surface-4'}`}>
                      <Car className={`w-4 h-4 ${selected.activeRide ? 'text-[#0B0B0B]' : 'text-ink-muted'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{selected.name}</p>
                      <p className="text-xs text-ink-muted">{selected.vehicle} · {selected.plate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-warning fill-warning" />
                    <span className="text-xs text-warning font-medium">{selected.rating.toFixed(1)}</span>
                  </div>

                  {selected.activeRide ? (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-2">
                      <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                        In corsa
                      </p>
                      <p className="text-xs text-ink-secondary">Volo {selected.activeRide.flightNumber}</p>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />
                        {selected.activeRide.passengers} passeggeri
                      </p>
                    </div>
                  ) : (
                    <div className="bg-surface-2 rounded-lg p-2">
                      <p className="text-xs text-ink-muted">Disponibile · In attesa</p>
                    </div>
                  )}

                  <p className="text-xs text-ink-muted mt-2">
                    {new Date(selected.lastSeen).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </Popup>
            )}
          </Map>
        )}

        {/* Legend overlay */}
        <div className="absolute bottom-6 left-6 bg-[#0B0B0B]/90 backdrop-blur rounded-xl p-4 text-sm border border-surface-4">
          <p className="text-white font-semibold text-xs mb-2">Legenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-500 border-2 border-primary-300 rounded-full flex items-center justify-center">
                <Car className="w-3 h-3 text-[#0B0B0B]" />
              </div>
              <span className="text-ink-secondary text-xs">Driver in corsa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-surface-4 border-2 border-surface-5 rounded-full flex items-center justify-center">
                <Car className="w-2.5 h-2.5 text-ink-muted" />
              </div>
              <span className="text-ink-secondary text-xs">Driver disponibile</span>
            </div>
          </div>
          <p className="text-ink-muted text-xs mt-2">Refresh ogni 15s</p>
        </div>

        {/* Empty state overlay */}
        {!loading && drivers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-[#0B0B0B]/90 backdrop-blur rounded-2xl p-6 text-center border border-surface-4">
              <Car className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <p className="text-white font-semibold">Nessun driver online</p>
              <p className="text-ink-muted text-sm mt-1">I driver appaiono qui quando sono attivi</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
