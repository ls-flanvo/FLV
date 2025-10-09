'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, User, Mail, Lock, Phone, FileText, Calendar, MapPin, Upload, ArrowLeft } from 'lucide-react';

export default function DriverSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Dati personali
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    taxCode: '',
    
    // Indirizzo
    address: '',
    city: '',
    province: '',
    zipCode: '',
    
    // Documenti
    driverLicense: '',
    licenseExpiry: '',
    cqcNumber: '',
    cqcExpiry: '',
    
    // Veicolo
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    licensePlate: '',
    vehicleColor: '',
    seats: '',
    
    // Assicurazione
    insuranceCompany: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    
    // Disponibilità
    availability: 'fulltime',
    
    // Accordi
    termsAccepted: false,
    privacyAccepted: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Rimuovi errore quando l'utente modifica il campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validazione dati personali
    if (!formData.name.trim()) newErrors.name = 'Nome obbligatorio';
    if (!formData.surname.trim()) newErrors.surname = 'Cognome obbligatorio';
    if (!formData.email.trim()) newErrors.email = 'Email obbligatoria';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    if (!formData.password) newErrors.password = 'Password obbligatoria';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password deve essere almeno 8 caratteri';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Telefono obbligatorio';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Data di nascita obbligatoria';
    if (!formData.taxCode.trim()) newErrors.taxCode = 'Codice fiscale obbligatorio';

    // Validazione documenti
    if (!formData.driverLicense.trim()) newErrors.driverLicense = 'Numero patente obbligatorio';
    if (!formData.licenseExpiry) newErrors.licenseExpiry = 'Scadenza patente obbligatoria';
    if (!formData.cqcNumber.trim()) newErrors.cqcNumber = 'Numero CQC obbligatorio';
    if (!formData.cqcExpiry) newErrors.cqcExpiry = 'Scadenza CQC obbligatoria';

    // Validazione veicolo
    if (!formData.vehicleBrand.trim()) newErrors.vehicleBrand = 'Marca veicolo obbligatoria';
    if (!formData.vehicleModel.trim()) newErrors.vehicleModel = 'Modello veicolo obbligatorio';
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'Targa obbligatoria';

    // Validazione accordi
    if (!formData.termsAccepted) newErrors.termsAccepted = 'Devi accettare i termini e condizioni';
    if (!formData.privacyAccepted) newErrors.privacyAccepted = 'Devi accettare la privacy policy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/driver/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registrazione completata! La tua richiesta è in attesa di approvazione. Riceverai una email di conferma.');
        router.push('/driver/login');
      } else {
        alert(data.error || 'Errore durante la registrazione');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Errore durante la registrazione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/driver/login"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna al login
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Diventa Autista Flanvo
          </h1>
          <p className="text-gray-600">
            Compila il modulo per unirti alla nostra rete di autisti professionisti
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          
          {/* Sezione 1: Dati Personali */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <User className="w-6 h-6 mr-3 text-primary-600" />
              Dati Personali
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mario"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cognome *
                </label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.surname ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Rossi"
                />
                {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="mario.rossi@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+39 333 1234567"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data di Nascita *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale *
                </label>
                <input
                  type="text"
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.taxCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="RSSMRA80A01H501Z"
                  maxLength={16}
                />
                {errors.taxCode && <p className="text-red-500 text-sm mt-1">{errors.taxCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minimo 8 caratteri"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conferma Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ripeti la password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Sezione 2: Indirizzo */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-primary-600" />
              Indirizzo
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Via Roma, 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Città
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Milano"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="MI"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CAP
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="20100"
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          {/* Sezione 3: Documenti */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-primary-600" />
              Documenti
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero Patente *
                </label>
                <input
                  type="text"
                  name="driverLicense"
                  value={formData.driverLicense}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.driverLicense ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="MI1234567X"
                />
                {errors.driverLicense && <p className="text-red-500 text-sm mt-1">{errors.driverLicense}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scadenza Patente *
                </label>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.licenseExpiry ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.licenseExpiry && <p className="text-red-500 text-sm mt-1">{errors.licenseExpiry}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero CQC *
                </label>
                <input
                  type="text"
                  name="cqcNumber"
                  value={formData.cqcNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.cqcNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="CQC1234567"
                />
                {errors.cqcNumber && <p className="text-red-500 text-sm mt-1">{errors.cqcNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scadenza CQC *
                </label>
                <input
                  type="date"
                  name="cqcExpiry"
                  value={formData.cqcExpiry}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.cqcExpiry ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cqcExpiry && <p className="text-red-500 text-sm mt-1">{errors.cqcExpiry}</p>}
              </div>
            </div>
          </div>

          {/* Sezione 4: Veicolo */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Car className="w-6 h-6 mr-3 text-primary-600" />
              Informazioni Veicolo
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca *
                </label>
                <input
                  type="text"
                  name="vehicleBrand"
                  value={formData.vehicleBrand}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.vehicleBrand ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mercedes-Benz"
                />
                {errors.vehicleBrand && <p className="text-red-500 text-sm mt-1">{errors.vehicleBrand}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modello *
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.vehicleModel ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Classe E"
                />
                {errors.vehicleModel && <p className="text-red-500 text-sm mt-1">{errors.vehicleModel}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anno
                </label>
                <input
                  type="number"
                  name="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="2023"
                  min="2000"
                  max="2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Targa *
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.licensePlate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="AB123CD"
                />
                {errors.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.licensePlate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colore
                </label>
                <input
                  type="text"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nero"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero Posti
                </label>
                <select
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Seleziona</option>
                  <option value="4">4 posti</option>
                  <option value="5">5 posti</option>
                  <option value="6">6 posti</option>
                  <option value="7">7 posti</option>
                  <option value="8">8 posti</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sezione 5: Assicurazione */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-primary-600" />
              Assicurazione
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compagnia Assicurativa
                </label>
                <input
                  type="text"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Generali, AXA, Allianz..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero Polizza
                </label>
                <input
                  type="text"
                  name="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="POL123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scadenza Assicurazione
                </label>
                <input
                  type="date"
                  name="insuranceExpiry"
                  value={formData.insuranceExpiry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sezione 6: Disponibilità */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-primary-600" />
              Disponibilità
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo di Disponibilità
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    value="fulltime"
                    checked={formData.availability === 'fulltime'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Full-time (Disponibile sempre)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    value="parttime"
                    checked={formData.availability === 'parttime'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Part-time (Orari flessibili)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    value="weekend"
                    checked={formData.availability === 'weekend'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Solo Weekend</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sezione 7: Termini e Condizioni */}
          <div className="border-t pt-8">
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className={`mt-1 w-5 h-5 text-primary-600 focus:ring-primary-500 rounded ${
                    errors.termsAccepted ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="text-sm text-gray-700">
                  Accetto i <Link href="/terms" className="text-primary-600 hover:underline">Termini e Condizioni</Link> e le politiche di servizio di Flanvo *
                </span>
              </label>
              {errors.termsAccepted && <p className="text-red-500 text-sm">{errors.termsAccepted}</p>}

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="privacyAccepted"
                  checked={formData.privacyAccepted}
                  onChange={handleChange}
                  className={`mt-1 w-5 h-5 text-primary-600 focus:ring-primary-500 rounded ${
                    errors.privacyAccepted ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="text-sm text-gray-700">
                  Accetto la <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link> e il trattamento dei miei dati personali *
                </span>
              </label>
              {errors.privacyAccepted && <p className="text-red-500 text-sm">{errors.privacyAccepted}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white py-4 px-8 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Invio in corso...' : 'Invia Candidatura'}
            </button>
            <Link
              href="/driver/login"
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
            >
              Annulla
            </Link>
          </div>

          <p className="text-sm text-gray-500 text-center">
            * Campi obbligatori
          </p>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Cosa succede dopo?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ <strong>Verifica documenti:</strong> Il nostro team controllerà i tuoi documenti entro 2-3 giorni lavorativi</li>
            <li>✅ <strong>Colloquio:</strong> Se i documenti sono in ordine, ti contatteremo per un breve colloquio</li>
            <li>✅ <strong>Formazione:</strong> Riceverai materiale informativo sulla piattaforma e le procedure</li>
            <li>✅ <strong>Attivazione:</strong> Una volta approvato, potrai iniziare a ricevere richieste di corsa!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}