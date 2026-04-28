'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Save, RefreshCw, CheckCircle } from 'lucide-react';

interface Config {
  driver_rate_per_km: string;
  flanvo_tier1_rate: string;
  flanvo_tier2_rate: string;
  flanvo_tier3_rate: string;
  protection_fee: string;
  min_group_size: string;
  max_group_size: string;
  matching_window_hours: string;
  dbscan_eps_km: string;
}

const FIELD_META: { key: keyof Config; label: string; description: string; unit: string; section: string }[] = [
  { key: 'driver_rate_per_km', label: 'Tariffa autista per km', description: "Quota all'autista per km. Riceve sempre il 100%.", unit: '€/km', section: 'Driver' },
  { key: 'flanvo_tier1_rate', label: 'Fee Flanvo — Tier 1 (0–50 km)', description: 'Fee Flanvo su corse brevi, divisa tra i passeggeri.', unit: '€/km', section: 'Flanvo Fee' },
  { key: 'flanvo_tier2_rate', label: 'Fee Flanvo — Tier 2 (51–99 km)', description: 'Fee Flanvo per corse medie. Meno del Tier 1.', unit: '€/km', section: 'Flanvo Fee' },
  { key: 'flanvo_tier3_rate', label: 'Fee Flanvo — Tier 3 (≥100 km)', description: 'Fee Flanvo per corse lunghe.', unit: '€/km', section: 'Flanvo Fee' },
  { key: 'protection_fee', label: 'Costo protezione', description: 'Fee fissa per passeggero a copertura pagamento.', unit: '€', section: 'Flanvo Fee' },
  { key: 'min_group_size', label: 'Min passeggeri per gruppo', description: 'Numero minimo per confermare un gruppo.', unit: 'pax', section: 'Matching' },
  { key: 'max_group_size', label: 'Max passeggeri per gruppo', description: 'Capacità massima van (max 7 posti).', unit: 'pax', section: 'Matching' },
  { key: 'matching_window_hours', label: 'Finestra di matching', description: 'Ore prima del volo entro cui fare matching.', unit: 'ore', section: 'Matching' },
  { key: 'dbscan_eps_km', label: 'Raggio DBSCAN (eps)', description: 'Raggio km per raggruppare destinazioni. Più alto = più ampio.', unit: 'km', section: 'Matching' },
];

const SECTIONS = ['Driver', 'Flanvo Fee', 'Matching'];

export default function AdminConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [draft, setDraft] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/config', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) { const data = await res.json(); setConfig(data.config); setDraft(data.config); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleChange = (key: keyof Config, value: string) => {
    setDraft(p => p ? { ...p, [key]: value } : p);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(draft),
      });
      if (res.ok) { setConfig(draft); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(draft);

  if (loading || !draft) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-2 border border-surface-5 rounded-xl">
                <Settings className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gestione Tariffe</h1>
                <p className="text-ink-muted text-xs">Configura prezzi e parametri del sistema</p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <button onClick={() => { setDraft(config); setSaved(false); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-surface-2 border border-surface-5 rounded-xl text-sm text-ink-secondary hover:text-white transition-all">
                  <RefreshCw className="w-3.5 h-3.5" /> Ripristina
                </button>
              )}
              <button onClick={handleSave} disabled={!hasChanges || saving}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  saved ? 'bg-success/15 border border-success/20 text-success'
                  : hasChanges ? 'bg-primary-500 text-[#0B0B0B] hover:bg-primary-400'
                  : 'bg-surface-3 text-ink-muted cursor-not-allowed'
                }`}>
                {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Salvato!</> : <><Save className="w-3.5 h-3.5" /> {saving ? 'Salvataggio...' : 'Salva'}</>}
              </button>
            </div>
          </div>
        </div>

        {/* Fields */}
        {SECTIONS.map(section => {
          const fields = FIELD_META.filter(f => f.section === section);
          return (
            <div key={section} className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2 px-1">{section}</p>
              <div className="bg-surface-1 border border-surface-4 rounded-2xl divide-y divide-surface-4">
                {fields.map(({ key, label, description, unit }) => (
                  <div key={key} className="px-5 py-4 flex items-start justify-between gap-5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                      <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
                      {config && config[key] !== draft[key] && (
                        <p className="mt-1.5 text-xs text-warning">
                          {config[key]} {unit} → <strong>{draft[key]} {unit}</strong>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number" step="0.01" min="0"
                        value={draft[key]}
                        onChange={e => handleChange(key, e.target.value)}
                        className="w-24 text-right px-3 py-2 bg-surface-2 border border-surface-5 rounded-xl focus:outline-none focus:border-primary-500 font-mono text-sm text-white transition-colors"
                      />
                      <span className="text-xs text-ink-muted w-8">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Formula box */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5">
          <p className="text-xs font-bold text-ink-secondary mb-3">Come funziona il pricing Flanvo</p>
          <div className="space-y-2 font-mono text-xs">
            {[
              'quota_driver = (distanza_km × €/km) ÷ n_passeggeri',
              'fee_flanvo = km_onboard × tier_rate + protezione',
              'prezzo_finale = quota_driver + fee_flanvo',
            ].map((f, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg ${i === 2 ? 'bg-primary-500/10 border border-primary-500/20 text-primary-400 font-bold' : 'bg-surface-2 text-ink-secondary'}`}>
                {f}
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-1 text-xs text-ink-muted">
            <li>• Il driver riceve <strong className="text-white">sempre il 100%</strong> della quota driver</li>
            <li>• Flanvo incassa solo la fee aggiunta sopra</li>
            <li>• Le modifiche valgono per le nuove prenotazioni</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
