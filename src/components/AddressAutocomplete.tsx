'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function AddressAutocomplete({
  value, onChange, placeholder = 'es. Via Roma 123, Milano',
  label = 'Indirizzo di destinazione', required = false, error
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasCoords, setHasCoords] = useState(false);
  const justSelected = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  useEffect(() => {
    // Non ricercare subito dopo una selezione
    if (justSelected.current) { justSelected.current = false; return; }
    if (hasCoords) return;
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }

    const timer = setTimeout(() => searchAddress(value), 300);
    return () => clearTimeout(timer);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current?.contains(e.target as Node) || inputRef.current?.contains(e.target as Node)) return;
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (query: string) => {
    if (!MAPBOX_TOKEN) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&country=IT&language=it&limit=5&types=address,place,poi`
      );
      const data = await res.json();
      if (data.features) { setSuggestions(data.features); setShowSuggestions(true); setSelectedIndex(-1); }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const handleSelectSuggestion = (s: AddressSuggestion) => {
    justSelected.current = true;
    setHasCoords(true);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(s.place_name, { lat: s.center[1], lng: s.center[0] });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasCoords(false);
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, -1)); }
    if (e.key === 'Enter' && selectedIndex >= 0) { e.preventDefault(); handleSelectSuggestion(suggestions[selectedIndex]); }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs text-ink-secondary mb-1.5">
          {label}{required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !hasCoords && value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-11 pr-10 py-3 bg-surface-2 border ${error ? 'border-danger' : 'border-surface-5'} rounded-xl text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 text-sm transition-colors`}
          required={required}
          autoComplete="off"
        />
        {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 animate-spin" />}
        {hasCoords && !isLoading && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />}
      </div>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {showSuggestions && suggestions.length > 0 && (
        <div ref={dropdownRef}
          className="absolute z-50 w-full mt-1.5 bg-surface-2 border border-surface-5 rounded-xl shadow-surface max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button key={s.id} type="button" onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-3 transition-colors border-b border-surface-4 last:border-0 ${i === selectedIndex ? 'bg-surface-3' : ''}`}>
              <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{s.text}</p>
                <p className="text-xs text-ink-muted truncate">{s.place_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
