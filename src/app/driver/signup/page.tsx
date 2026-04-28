'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, User, Mail, Lock, Phone, FileText, Calendar, MapPin, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

type Step = 'personal' | 'vehicle' | 'documents' | 'done';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'personal', label: 'Dati personali', icon: User },
  { key: 'vehicle', label: 'Veicolo', icon: Car },
  { key: 'documents', label: 'Documenti', icon: FileText },
];

const STEP_ORDER: Step[] = ['personal', 'vehicle', 'documents'];

export default function DriverSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', surname: '', email: '', phone: '',
    dateOfBirth: '', taxCode: '', password: '', confirmPassword: '',
    address: '', city: '', province: '', zipCode: '',
    vehicleBrand: '', vehicleModel: '', vehicleYear: '', licensePlate: '', vehicleColor: '', seats: '',
    insuranceCompany: '', insuranceNumber: '', insuranceExpiry: '',
    driverLicense: '', licenseExpiry: '', cqcNumber: '', cqcExpiry: '',
    availability: 'fulltime', termsAccepted: false, privacyAccepted: false,
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const t = e.target as HTMLInputElement;
    set(t.name, t.type === 'checkbox' ? t.checked : t.value);
  };

  const currentIdx = STEP_ORDER.indexOf(step);
  const progress = ((currentIdx + 1) / STEP_ORDER.length) * 100;

  const validateStep = (): string => {
    if (step === 'personal') {
      if (!form.name.trim()) return 'Nome obbligatorio';
      if (!form.surname.trim()) return 'Cognome obbligatorio';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email non valida';
      if (!form.phone.trim()) return 'Telefono obbligatorio';
      if (form.password.length < 8) return 'Password minimo 8 caratteri';
      if (form.password !== form.confirmPassword) return 'Le password non coincidono';
      if (!form.taxCode.trim()) return 'Codice fiscale obbligatorio';
    }
    if (step === 'vehicle') {
      if (!form.vehicleBrand.trim()) return 'Marca obbligatoria';
      if (!form.vehicleModel.trim()) return 'Modello obbligatorio';
      if (!form.licensePlate.trim()) return 'Targa obbligatoria';
    }
    if (step === 'documents') {
      if (!form.driverLicense.trim()) return 'Numero patente obbligatorio';
      if (!form.licenseExpiry) return 'Scadenza patente obbligatoria';
      if (!form.cqcNumber.trim()) return 'Numero CQC obbligatorio';
      if (!form.cqcExpiry) return 'Scadenza CQC obbligatoria';
      if (!form.termsAccepted) return 'Devi accettare i Termini e Condizioni';
      if (!form.privacyAccepted) return 'Devi accettare la Privacy Policy';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
    } else {
      handleSubmit();
    }
  };

  const back = () => {
    setError('');
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/driver/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: `${form.name} ${form.surname}`.trim(),
          vehicleModel: `${form.vehicleBrand} ${form.vehicleModel}`.trim(),
          vehicleYear: Number(form.vehicleYear) || new Date().getFullYear(),
          vehiclePlate: form.licensePlate,
          licenseNumber: form.driverLicense,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('done');
      } else {
        setError(data.error || 'Errore durante la registrazione');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-12 bg-hero-gradient">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="w-20 h-20 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Candidatura inviata!</h1>
          <p className="text-ink-secondary text-sm mb-8">
            Il nostro team verificherà i tuoi documenti entro 2–3 giorni lavorativi.
            Riceverai una email all&apos;indirizzo <span className="text-white font-medium">{form.email}</span>.
          </p>
          <div className="space-y-3 bg-surface-1 border border-surface-4 rounded-2xl p-5 text-left mb-8">
            {[
              'Verifica documenti (2–3 gg)',
              'Approvazione account',
              'Collega IBAN con Stripe',
              'Inizia a guadagnare',
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                  {i + 1}
                </div>
                <span className="text-sm text-ink-secondary">{s}</span>
              </div>
            ))}
          </div>
          <Link href="/driver/login">
            <button className="w-full py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all">
              Vai al login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-3 bg-surface-2 border ${err ? 'border-danger' : 'border-surface-5'} rounded-xl text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 text-sm transition-colors`;

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-10 px-4 bg-hero-gradient">
      <div className="max-w-lg mx-auto">
        {/* Logo + back */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/driver/login" className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Login autisti
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <svg width="16" height="22" viewBox="0 0 56 72" fill="none">
              <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00D1B2"/>
            </svg>
            <span className="text-sm font-bold text-white">flanvo</span>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Diventa autista</h1>
          <p className="text-ink-secondary text-sm">Guadagna trasportando gruppi in aeroporto</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const active = s.key === step;
              const done = STEP_ORDER.indexOf(s.key) < currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done ? 'bg-primary-500 text-[#0B0B0B]' : active ? 'bg-primary-500/20 border border-primary-500 text-primary-400' : 'bg-surface-3 text-ink-muted'
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-white' : 'text-ink-muted'}`}>{s.label}</span>
                  {i < STEPS.length - 1 && <div className={`w-8 h-px mx-1 ${done ? 'bg-primary-500' : 'bg-surface-4'}`} />}
                </div>
              );
            })}
          </div>
          <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 bg-card-gradient">
          {error && (
            <div className="flex items-center gap-3 bg-danger/10 border border-danger/20 rounded-xl p-3.5 mb-5">
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* STEP: Personal */}
          {step === 'personal' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-5">
                <User className="w-4 h-4 text-primary-400" />
                <h2 className="font-bold text-white">Dati personali</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Nome *</label>
                  <input name="name" value={form.name} onChange={ch} placeholder="Mario" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Cognome *</label>
                  <input name="surname" value={form.surname} onChange={ch} placeholder="Rossi" className={inputCls()} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Email *</label>
                <input name="email" type="email" value={form.email} onChange={ch} placeholder="mario.rossi@email.com" className={inputCls()} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Telefono *</label>
                  <input name="phone" type="tel" value={form.phone} onChange={ch} placeholder="+39 333 1234567" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Data di nascita</label>
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={ch} className={`${inputCls()} [color-scheme:dark]`} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Codice fiscale *</label>
                <input name="taxCode" value={form.taxCode} onChange={ch} placeholder="RSSMRA80A01H501Z" maxLength={16} className={inputCls()} style={{ textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Città di residenza</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input name="city" value={form.city} onChange={ch} placeholder="Milano" className={inputCls()} />
                  </div>
                  <input name="province" value={form.province} onChange={ch} placeholder="MI" maxLength={2} className={inputCls()} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Password *</label>
                <input name="password" type="password" value={form.password} onChange={ch} placeholder="Minimo 8 caratteri" className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Conferma password *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={ch} placeholder="Ripeti la password" className={inputCls()} />
              </div>
            </div>
          )}

          {/* STEP: Vehicle */}
          {step === 'vehicle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-5">
                <Car className="w-4 h-4 text-primary-400" />
                <h2 className="font-bold text-white">Informazioni veicolo</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Marca *</label>
                  <input name="vehicleBrand" value={form.vehicleBrand} onChange={ch} placeholder="Mercedes-Benz" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Modello *</label>
                  <input name="vehicleModel" value={form.vehicleModel} onChange={ch} placeholder="Vito 116 CDI" className={inputCls()} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Anno</label>
                  <input name="vehicleYear" type="number" value={form.vehicleYear} onChange={ch} placeholder="2022" min="2000" max="2026" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Posti</label>
                  <select name="seats" value={form.seats} onChange={ch} className={inputCls()}>
                    <option value="">Seleziona</option>
                    {[4,5,6,7,8].map(n => <option key={n} value={n}>{n} posti</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Targa *</label>
                  <input name="licensePlate" value={form.licensePlate} onChange={ch} placeholder="AB123CD" className={inputCls()} style={{ textTransform: 'uppercase' }} />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Colore</label>
                  <input name="vehicleColor" value={form.vehicleColor} onChange={ch} placeholder="Nero" className={inputCls()} />
                </div>
              </div>
              <div className="border-t border-surface-4 pt-4 mt-2">
                <p className="text-xs text-ink-secondary mb-3">Assicurazione (opzionale)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input name="insuranceCompany" value={form.insuranceCompany} onChange={ch} placeholder="Compagnia" className={inputCls()} />
                  <input name="insuranceNumber" value={form.insuranceNumber} onChange={ch} placeholder="N° polizza" className={inputCls()} />
                </div>
                <div className="mt-3">
                  <input name="insuranceExpiry" type="date" value={form.insuranceExpiry} onChange={ch} className={`${inputCls()} [color-scheme:dark]`} />
                </div>
              </div>
              <div className="border-t border-surface-4 pt-4">
                <p className="text-xs text-ink-secondary mb-3">Disponibilità</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'fulltime', l: 'Full-time' },
                    { v: 'parttime', l: 'Part-time' },
                    { v: 'weekend', l: 'Weekend' },
                  ].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('availability', opt.v)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.availability === opt.v
                          ? 'bg-primary-500/15 border-primary-500 text-primary-400'
                          : 'bg-surface-2 border-surface-5 text-ink-secondary hover:border-surface-4'
                      }`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: Documents */}
          {step === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-4 h-4 text-primary-400" />
                <h2 className="font-bold text-white">Documenti</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">N° Patente *</label>
                  <input name="driverLicense" value={form.driverLicense} onChange={ch} placeholder="MI1234567X" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Scadenza patente *</label>
                  <input name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={ch} className={`${inputCls()} [color-scheme:dark]`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">N° CQC *</label>
                  <input name="cqcNumber" value={form.cqcNumber} onChange={ch} placeholder="CQC1234567" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Scadenza CQC *</label>
                  <input name="cqcExpiry" type="date" value={form.cqcExpiry} onChange={ch} className={`${inputCls()} [color-scheme:dark]`} />
                </div>
              </div>

              <div className="bg-surface-2 border border-surface-5 rounded-xl p-4 mt-2">
                <p className="text-xs font-semibold text-ink-secondary mb-3">Cosa succede dopo?</p>
                {['Verifica documenti (2–3 gg lavorativi)', 'Approvazione account', 'Setup pagamenti Stripe', 'Inizia a ricevere corse'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 mb-2 last:mb-0">
                    <div className="w-4 h-4 rounded-full bg-primary-500/10 flex items-center justify-center text-[10px] font-bold text-primary-400 shrink-0">{i + 1}</div>
                    <span className="text-xs text-ink-secondary">{s}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-surface-4 pt-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    form.termsAccepted ? 'bg-primary-500 border-primary-500' : 'border-surface-5 bg-surface-2'
                  }`} onClick={() => set('termsAccepted', !form.termsAccepted)}>
                    {form.termsAccepted && <CheckCircle className="w-3 h-3 text-[#0B0B0B]" />}
                  </div>
                  <span className="text-xs text-ink-secondary leading-relaxed">
                    Accetto i <Link href="/terms" className="text-primary-400 hover:underline">Termini e Condizioni</Link> e le politiche di servizio Flanvo *
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    form.privacyAccepted ? 'bg-primary-500 border-primary-500' : 'border-surface-5 bg-surface-2'
                  }`} onClick={() => set('privacyAccepted', !form.privacyAccepted)}>
                    {form.privacyAccepted && <CheckCircle className="w-3 h-3 text-[#0B0B0B]" />}
                  </div>
                  <span className="text-xs text-ink-secondary leading-relaxed">
                    Accetto la <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link> e il trattamento dei dati personali *
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-surface-4">
            {currentIdx > 0 && (
              <button type="button" onClick={back}
                className="px-5 py-3 bg-surface-2 border border-surface-5 text-ink-secondary rounded-xl text-sm font-medium hover:text-white hover:border-surface-4 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={next} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-50 text-sm">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#0B0B0B]/30 border-t-[#0B0B0B] rounded-full animate-spin" /> Invio...</span>
              ) : currentIdx < STEP_ORDER.length - 1 ? (
                <><span>Continua</span><ArrowRight className="w-4 h-4" /></>
              ) : (
                'Invia candidatura'
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">
          Hai già un account?{' '}
          <Link href="/driver/login" className="text-primary-400 hover:underline">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
