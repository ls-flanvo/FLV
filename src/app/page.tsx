import Link from 'next/link';
import { Plane, Users, DollarSign, Clock, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-dark-800 to-dark-900">
  <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
    <div className="text-center">
      <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
        Condividi il tuo viaggio
        <span className="block text-primary-500 mt-2">Risparmia sui trasferimenti aeroportuali</span>
      </h1>
      <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
        Connettiti con passeggeri dello stesso volo e condividi corse NCC/taxi dall'aeroporto. 
        Risparmia denaro, riduci l'impatto ambientale e viaggia in sicurezza.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/signup"
          className="bg-accent-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent-600 transition-all shadow-lg hover:shadow-xl"
        >
          Inizia Ora Gratis
        </Link>
        <Link
          href="/login"
          className="bg-primary-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-600 transition-all"
        >
          Accedi
        </Link>
      </div>
    </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">60%</div>
            <p className="text-gray-600">Risparmio medio</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">10k+</div>
            <p className="text-gray-600">Corse completate</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">4.8★</div>
            <p className="text-gray-600">Valutazione media</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Come funziona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Inserisci il tuo volo</h3>
              <p className="text-gray-600">
                Aggiungi i dettagli del tuo volo e la destinazione finale
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Trova compagni</h3>
              <p className="text-gray-600">
                Il nostro algoritmo trova passeggeri con destinazioni simili
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Condividi i costi</h3>
              <p className="text-gray-600">
                Dividi il costo della corsa proporzionalmente alla distanza
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Perché scegliere Flanvo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <DollarSign className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Risparmia denaro</h3>
              <p className="text-gray-600">
                Riduci i costi del trasporto aeroportuale fino al 60%
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Shield className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Viaggia sicuro</h3>
              <p className="text-gray-600">
                Autisti verificati e passeggeri dello stesso volo
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Clock className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gestione ritardi</h3>
              <p className="text-gray-600">
                Monitoraggio in tempo reale dei voli e adattamento automatico
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Zap className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Prenotazione rapida</h3>
              <p className="text-gray-600">
                Trova e prenota la tua corsa in pochi minuti
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Users className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Socializza</h3>
              <p className="text-gray-600">
                Incontra altri viaggiatori e condividi esperienze
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Plane className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Eco-friendly</h3>
              <p className="text-gray-600">
                Riduci le emissioni condividendo i viaggi
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto a risparmiare sul tuo prossimo viaggio?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Unisciti a migliaia di viaggiatori che hanno già scoperto il modo smart di viaggiare
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
          >
            Registrati Gratuitamente
          </Link>
        </div>
      </section>
    </div>
  );
}