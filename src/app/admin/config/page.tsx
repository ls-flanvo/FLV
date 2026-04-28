'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Save, RefreshCw } from 'lucide-react';

interface Config {
  driver_rate_per_km: string;
  flanvo_fee_rate: string;
  protection_fee: string;
  min_group_size: string;
  max_group_size: string;
  matching_window_hours: string;
  dbscan_eps_km: string;
}

const FIELD_META: { key: keyof Config; label: string; description: string; unit: string }[] = [
  { key: 'driver_rate_per_km', label: 'Tariffa autista per km', description: 'Compenso per km percorso (€/km)', unit: '€/km' },
  { key: 'flanvo_fee_rate', label: 'Commissione Flanvo', description: 'Percentuale sui ricavi totali (es: 0.20 = 20%)', unit: '%' },
  { key: 'protection_fee', label: 'Costo protezione acquisto', description: 'Fee fissa per la protezione del pagamento', unit: '€' },
  { key: 'min_group_size', label: 'Min passeggeri per gruppo', description: 'Numero minimo per confermare un gruppo', unit: 'pax' },
  { key: 'max_group_size', label: 'Max passeggeri per gruppo', description: 'Capacità massima di un gruppo', unit: 'pax' },
  { key: 'matching_window_hours', label: 'Finestra di matching', description: 'Ore entro cui effettuare il matching dal volo', unit: 'ore' },
  { key: 'dbscan_eps_km', label: 'Raggio DBSCAN (eps)', description: 'Raggio in km per raggruppare destinazioni vicine', unit: 'km' },
];

export default function AdminConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [draft, setDraft] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setDraft(data.config);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof Config, value: string) => {
    setDraft((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setConfig(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(config);
    setSaved(false);
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(draft);

  if (loading || !draft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento configurazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-primary-600" />
                Gestione Tariffe
              </h1>
              <p className="text-gray-600 mt-1">Configura prezzi e parametri del sistema</p>
            </div>
            <div className="flex gap-3">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Ripristina
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`flex items-center px-6 py-2 rounded-lg font-semibold transition-colors ${
                  saved
                    ? 'bg-green-600 text-white'
                    : hasChanges
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Salva modifiche'}
              </button>
            </div>
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
            Configurazione salvata con successo. Le modifiche sono attive immediatamente.
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {FIELD_META.map(({ key, label, description, unit }) => (
            <div key={key} className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    {label}
                  </label>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={draft[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-28 text-right px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-gray-900"
                  />
                  <span className="text-sm text-gray-500 w-10">{unit}</span>
                </div>
              </div>
              {config && config[key] !== draft[key] && (
                <p className="mt-2 text-xs text-amber-600">
                  Valore attuale: {config[key]} {unit} → Nuovo: {draft[key]} {unit}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <strong>Formula di pricing applicata:</strong><br />
          <code className="block mt-2 bg-blue-100 px-3 py-2 rounded font-mono text-xs">
            prezzo_per_pax = distanza_km × tariffa_km ÷ n_passeggeri + commissione_flanvo + protezione
          </code>
          <p className="mt-2 text-xs text-blue-600">
            Le modifiche hanno effetto sulle nuove prenotazioni. Le prenotazioni già confermate mantengono il prezzo originale.
          </p>
        </div>
      </div>
    </div>
  );
}
