'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  ArrowLeft,
  Car,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye
} from 'lucide-react';

interface PendingDriver {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  taxCode: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  driverLicense: string;
  licenseExpiry: string;
  cqcNumber: string;
  cqcExpiry: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  licensePlate: string;
  vehicleColor: string;
  seats: string;
  insuranceCompany: string;
  insuranceNumber: string;
  insuranceExpiry: string;
  availability: string;
  submittedAt: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
}

export default function AdminApproveDriversPage() {
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      // Mock data per demo
      const mockDrivers: PendingDriver[] = [
        {
          id: '1',
          name: 'Paolo',
          surname: 'Verdi',
          email: 'paolo.verdi@email.com',
          phone: '+39 336 5551234',
          dateOfBirth: '1985-06-15',
          taxCode: 'VRDPLA85H15F205Z',
          address: 'Via Roma, 123',
          city: 'Milano',
          province: 'MI',
          zipCode: '20100',
          driverLicense: 'MI1234567X',
          licenseExpiry: '2027-12-31',
          cqcNumber: 'CQC9876543',
          cqcExpiry: '2026-06-30',
          vehicleBrand: 'Mercedes-Benz',
          vehicleModel: 'Classe E',
          vehicleYear: '2022',
          licensePlate: 'AB123CD',
          vehicleColor: 'Nero',
          seats: '4',
          insuranceCompany: 'Generali',
          insuranceNumber: 'POL123456789',
          insuranceExpiry: '2025-12-31',
          availability: 'fulltime',
          submittedAt: '2024-10-01T10:30:00',
          status: 'pending'
        },
        {
          id: '2',
          name: 'Laura',
          surname: 'Gialli',
          email: 'laura.gialli@email.com',
          phone: '+39 337 8889999',
          dateOfBirth: '1990-03-22',
          taxCode: 'GLLLRA90C62F205W',
          address: 'Corso Italia, 45',
          city: 'Roma',
          province: 'RM',
          zipCode: '00100',
          driverLicense: 'RM7654321Y',
          licenseExpiry: '2028-08-15',
          cqcNumber: 'CQC5554443',
          cqcExpiry: '2027-03-20',
          vehicleBrand: 'BMW',
          vehicleModel: 'Serie 5',
          vehicleYear: '2023',
          licensePlate: 'EF456GH',
          vehicleColor: 'Bianco',
          seats: '5',
          insuranceCompany: 'AXA',
          insuranceNumber: 'POL987654321',
          insuranceExpiry: '2026-01-15',
          availability: 'parttime',
          submittedAt: '2024-10-03T14:15:00',
          status: 'pending'
        },
        {
          id: '3',
          name: 'Marco',
          surname: 'Blu',
          email: 'marco.blu@email.com',
          phone: '+39 338 1112223',
          dateOfBirth: '1988-11-10',
          taxCode: 'BLUMRC88S10F205K',
          address: 'Piazza Duomo, 7',
          city: 'Torino',
          province: 'TO',
          zipCode: '10100',
          driverLicense: 'TO9998887X',
          licenseExpiry: '2026-05-20',
          cqcNumber: 'CQC1112223',
          cqcExpiry: '2025-11-30',
          vehicleBrand: 'Audi',
          vehicleModel: 'A6',
          vehicleYear: '2021',
          licensePlate: 'IJ789KL',
          vehicleColor: 'Grigio',
          seats: '4',
          insuranceCompany: 'Allianz',
          insuranceNumber: 'POL456789123',
          insuranceExpiry: '2025-10-31',
          availability: 'weekend',
          submittedAt: '2024-10-05T09:45:00',
          status: 'reviewing'
        }
      ];

      setDrivers(mockDrivers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending drivers:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (driverId: string) => {
    if (!confirm('Sei sicuro di voler approvare questo autista?')) return;

    try {
      await fetch(`/api/admin/drivers/${driverId}/approve`, { method: 'POST' });
      setDrivers(drivers.filter(d => d.id !== driverId));
      setShowDetailModal(false);
      alert('Autista approvato! Riceverà una email di conferma.');
    } catch (error) {
      alert('Errore durante l\'approvazione');
    }
  };

  const handleReject = async (driverId: string) => {
    if (!rejectionReason.trim()) {
      alert('Inserisci un motivo per il rifiuto');
      return;
    }

    try {
      await fetch(`/api/admin/drivers/${driverId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });
      setDrivers(drivers.filter(d => d.id !== driverId));
      setShowDetailModal(false);
      setShowRejectionModal(false);
      setRejectionReason('');
      alert('Candidatura rifiutata. L\'autista riceverà una notifica.');
    } catch (error) {
      alert('Errore durante il rifiuto');
    }
  };

  const openDetailModal = (driver: PendingDriver) => {
    setSelectedDriver(driver);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento richieste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserCheck className="w-8 h-8 mr-3 text-primary-600" />
                Approva Autisti
              </h1>
              <p className="text-gray-600 mt-1">
                Verifica e approva le candidature degli autisti
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mb-1">In Attesa</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {drivers.filter(d => d.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">In Revisione</p>
                <p className="text-3xl font-bold text-blue-900">
                  {drivers.filter(d => d.status === 'reviewing').length}
                </p>
              </div>
              <Eye className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Totale Richieste</p>
                <p className="text-3xl font-bold text-green-900">{drivers.length}</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-400" />
            </div>
          </div>
        </div>

        {/* Drivers List */}
        <div className="space-y-4">
          {drivers.map((driver) => (
            <div key={driver.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl mr-4">
                      {driver.name.charAt(0)}{driver.surname.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {driver.name} {driver.surname}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Inviata il {new Date(driver.submittedAt).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <span className={`inline-flex items-center px-3 py-1 mt-2 text-xs font-medium rounded-full ${
                        driver.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : driver.status === 'reviewing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {driver.status === 'pending' ? '⏳ In Attesa' : driver.status === 'reviewing' ? '👁️ In Revisione' : '✅ Approvato'}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-4">
                    {/* Contatti */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-primary-600" />
                        Contatti
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {driver.email}
                        </p>
                        <p className="text-gray-600 flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {driver.phone}
                        </p>
                        <p className="text-gray-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {driver.city}, {driver.province}
                        </p>
                      </div>
                    </div>

                    {/* Documenti */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-primary-600" />
                        Documenti
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Patente:</span> {driver.driverLicense}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Scad.:</span> {new Date(driver.licenseExpiry).toLocaleDateString('it-IT')}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">CQC:</span> {driver.cqcNumber}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Scad.:</span> {new Date(driver.cqcExpiry).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>

                    {/* Veicolo */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Car className="w-4 h-4 mr-2 text-primary-600" />
                        Veicolo
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">{driver.vehicleBrand} {driver.vehicleModel}</span>
                        </p>
                        <p className="text-gray-600">Anno: {driver.vehicleYear}</p>
                        <p className="text-gray-600">Targa: {driver.licensePlate}</p>
                        <p className="text-gray-600">Colore: {driver.vehicleColor}</p>
                        <p className="text-gray-600">Posti: {driver.seats}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openDetailModal(driver)}
                  className="flex-1 min-w-[200px] bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Vedi Dettagli Completi
                </button>
                <button
                  onClick={() => handleApprove(driver.id)}
                  className="flex-1 min-w-[150px] bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approva
                </button>
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    setShowRejectionModal(true);
                  }}
                  className="flex-1 min-w-[150px] bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Rifiuta
                </button>
              </div>
            </div>
          ))}

          {drivers.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta in attesa</h3>
              <p className="text-gray-600">
                Al momento non ci sono candidature di autisti da approvare.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Dettagli Candidatura - {selectedDriver.name} {selectedDriver.surname}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dati Personali */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  Dati Personali
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Nome Completo</p>
                    <p className="font-medium text-gray-900">{selectedDriver.name} {selectedDriver.surname}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data di Nascita</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedDriver.dateOfBirth).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Codice Fiscale</p>
                    <p className="font-medium text-gray-900">{selectedDriver.taxCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedDriver.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefono</p>
                    <p className="font-medium text-gray-900">{selectedDriver.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Disponibilità</p>
                    <p className="font-medium text-gray-900">
                      {selectedDriver.availability === 'fulltime' ? 'Full-time' :
                       selectedDriver.availability === 'parttime' ? 'Part-time' : 'Solo Weekend'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Indirizzo */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                  Indirizzo
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedDriver.address}, {selectedDriver.zipCode} {selectedDriver.city} ({selectedDriver.province})
                  </p>
                </div>
              </div>

              {/* Documenti */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  Documenti di Guida
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Numero Patente</p>
                    <p className="font-medium text-gray-900">{selectedDriver.driverLicense}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scadenza Patente</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedDriver.licenseExpiry).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numero CQC</p>
                    <p className="font-medium text-gray-900">{selectedDriver.cqcNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scadenza CQC</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedDriver.cqcExpiry).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Veicolo */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-primary-600" />
                  Informazioni Veicolo
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Marca e Modello</p>
                    <p className="font-medium text-gray-900">
                      {selectedDriver.vehicleBrand} {selectedDriver.vehicleModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Anno</p>
                    <p className="font-medium text-gray-900">{selectedDriver.vehicleYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Targa</p>
                    <p className="font-medium text-gray-900">{selectedDriver.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Colore</p>
                    <p className="font-medium text-gray-900">{selectedDriver.vehicleColor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numero Posti</p>
                    <p className="font-medium text-gray-900">{selectedDriver.seats} posti</p>
                  </div>
                </div>
              </div>

              {/* Assicurazione */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  Assicurazione
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Compagnia</p>
                    <p className="font-medium text-gray-900">{selectedDriver.insuranceCompany}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numero Polizza</p>
                    <p className="font-medium text-gray-900">{selectedDriver.insuranceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scadenza</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedDriver.insuranceExpiry).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(selectedDriver.id)}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approva Candidatura
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowRejectionModal(true);
                  }}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Rifiuta Candidatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Rifiuta Candidatura
            </h3>
            <p className="text-gray-600 mb-4">
              Inserisci il motivo del rifiuto per {selectedDriver.name} {selectedDriver.surname}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Es: Documenti scaduti, veicolo non idoneo..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedDriver.id)}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Conferma Rifiuto
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}