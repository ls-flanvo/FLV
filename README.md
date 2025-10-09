# 🚗 Flanvo - Piattaforma NCC Premium

![Flanvo Logo](https://via.placeholder.com/1200x300/6366f1/ffffff?text=Flanvo+-+Your+Premium+Ride)

**Flanvo** è una piattaforma moderna e completa per la gestione di servizi NCC (Noleggio Con Conducente), che connette passeggeri e autisti professionisti per trasferimenti aeroportuali e servizi di mobilità premium.

## 📋 Indice

- [Caratteristiche Principali](#caratteristiche-principali)
- [Tech Stack](#tech-stack)
- [Requisiti di Sistema](#requisiti-di-sistema)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Avvio del Progetto](#avvio-del-progetto)
- [Struttura del Progetto](#struttura-del-progetto)
- [Ruoli Utente](#ruoli-utente)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contribuire](#contribuire)
- [Licenza](#licenza)

## ✨ Caratteristiche Principali

### 👥 Per i Passeggeri
- 🔍 **Ricerca Intelligente**: Ricerca per numero di volo con rilevamento automatico aeroporto
- 📱 **Prenotazione Semplice**: Processo di booking intuitivo in pochi click
- 💳 **Pagamenti Sicuri**: Integrazione con Stripe per pagamenti sicuri
- 📧 **Notifiche Real-time**: Email e notifiche push per aggiornamenti prenotazione
- 🎫 **Dashboard Personale**: Visualizza e gestisci tutte le tue prenotazioni
- ⭐ **Sistema di Valutazioni**: Recensisci autisti e corse completate
- 🔄 **Gestione Cancellazioni**: Cancella con politiche di rimborso trasparenti
- 🛫 **Flight Tracking**: Monitoraggio automatico dei voli in tempo reale

### 🚖 Per gli Autisti
- 📝 **Registrazione Facilitata**: Form completo per registrazione con verifica documenti
- 🚗 **Gestione Veicolo**: Carica info veicolo, documenti e assicurazione
- 📊 **Dashboard Completa**: Visualizza corse, guadagni e statistiche
- 🗓️ **Calendario Disponibilità**: Gestisci la tua disponibilità
- 💰 **Tracking Guadagni**: Monitora i tuoi ricavi in tempo reale
- 🔔 **Notifiche Corse**: Ricevi notifiche per nuove richieste
- 📍 **GPS Tracking**: Sistema di localizzazione per tracking corse

### 👨‍💼 Per gli Admin
- 📈 **Analytics Avanzate**: Dashboard con KPI e metriche business
- 👥 **Gestione Utenti**: Visualizza, modifica, sospendi utenti
- ✅ **Approvazione Autisti**: Sistema di verifica documenti autisti
- 💵 **Report Finanziari**: Analisi ricavi, commissioni e performance
- 🚗 **Monitor Corse**: Visualizza tutte le corse in tempo reale
- 📊 **Export Dati**: Esporta report in PDF ed Excel

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms**: React Hook Form + Zod validation

### Backend
- **API Routes**: Next.js API Routes
- **Database**: [PostgreSQL](https://www.postgresql.org/) / [MySQL](https://www.mysql.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT + HTTP-only cookies
- **Email**: [Resend](https://resend.com/) / [SendGrid](https://sendgrid.com/)

### Servizi Esterni
- **Pagamenti**: [Stripe](https://stripe.com/)
- **Flight Data**: Aviation Stack API / FlightAware API
- **Maps**: [Mapbox](https://www.mapbox.com/)
- **Storage**: AWS S3 / Cloudinary (per documenti e immagini)

### DevOps & Tools
- **Package Manager**: npm / pnpm
- **Version Control**: Git
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions / Vercel

## 📦 Requisiti di Sistema

- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0 (o pnpm >= 8.0.0)
- **Database**: PostgreSQL >= 14 o MySQL >= 8.0
- **Sistema Operativo**: Windows, macOS, o Linux

## 🚀 Installazione

### 1. Clona il Repository

```bash
git clone https://github.com/ls-flanvo/FLV.git
cd FLV
```

### 2. Installa le Dipendenze

```bash
npm install
# oppure
pnpm install
```

### 3. Configura il Database

```bash
# Crea il database (PostgreSQL)
createdb flanvo_db

# Oppure usa il client MySQL
mysql -u root -p
CREATE DATABASE flanvo_db;
```

### 4. Configura le Variabili d'Ambiente

Crea un file `.env.local` nella root del progetto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/flanvo_db"
# oppure per MySQL
# DATABASE_URL="mysql://user:password@localhost:3306/flanvo_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@flanvo.com"

# Flight API (Aviation Stack)
AVIATION_STACK_API_KEY="your-api-key"

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="pk.your-mapbox-token"

# AWS S3 (per upload documenti)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="eu-west-1"
AWS_S3_BUCKET="flanvo-documents"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Esegui le Migrazioni Database

```bash
# Genera il client Prisma
npx prisma generate

# Esegui le migrazioni
npx prisma migrate dev

# (Opzionale) Seed del database con dati di esempio
npx prisma db seed
```

## ⚙️ Configurazione

### Stripe Setup

1. Crea un account su [Stripe](https://stripe.com)
2. Ottieni le chiavi API dalla Dashboard
3. Configura i webhook:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Eventi: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Email Setup (Resend)

1. Registrati su [Resend](https://resend.com)
2. Verifica il tuo dominio
3. Crea un'API key
4. Configura i template email nella dashboard

### Flight API Setup

1. Registrati su [Aviation Stack](https://aviationstack.com)
2. Ottieni la API key
3. Configura il piano in base al volume di richieste previsto

### Mapbox Setup

1. Registrati su [Mapbox](https://www.mapbox.com)
2. Crea un access token
3. Configura gli stili della mappa nel dashboard

## 🎬 Avvio del Progetto

### Ambiente di Sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### Build di Produzione

```bash
npm run build
npm run start
```

### Verifica del Database

```bash
# Apri Prisma Studio
npx prisma studio
```

## 📁 Struttura del Progetto

```
flanvo/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Route gruppo: autenticazione
│   │   │   ├── login/           # Login page
│   │   │   └── signup/          # Registrazione
│   │   ├── admin/               # Area amministrazione
│   │   │   ├── dashboard/       # Dashboard admin
│   │   │   ├── users/           # Gestione utenti
│   │   │   ├── drivers/         # Gestione autisti
│   │   │   │   └── approve/     # Approvazione autisti
│   │   │   ├── reports/         # Report finanziari
│   │   │   └── rides/           # Monitor corse
│   │   │       └── monitor/     # Tracking real-time
│   │   ├── driver/              # Area autista
│   │   │   ├── dashboard/       # Dashboard autista
│   │   │   ├── login/           # Login autista
│   │   │   ├── signup/          # Registrazione autista
│   │   │   └── rides/           # Gestione corse
│   │   ├── dashboard/           # Dashboard passeggero
│   │   ├── flight-search/       # Ricerca per volo
│   │   ├── booking/             # Processo prenotazione
│   │   ├── checkout/            # Pagamento
│   │   ├── tracking/            # Tracking corsa
│   │   ├── matching/            # Sistema matching
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/            # Autenticazione
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── driver/
│   │   │   │       └── signup/
│   │   │   ├── bookings/        # Gestione prenotazioni
│   │   │   │   └── [id]/
│   │   │   │       └── cancel/
│   │   │   ├── flights/         # API voli
│   │   │   │   └── [code]/
│   │   │   ├── driver/          # API autisti
│   │   │   │   └── rides/
│   │   │   ├── tracking/        # Tracking API
│   │   │   │   └── [id]/
│   │   │   ├── matching/        # Matching algorithm
│   │   │   └── webhooks/        # Webhook esterni
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Homepage
│   │   └── globals.css          # Stili globali
│   ├── components/              # Componenti React
│   │   ├── ui/                  # Componenti UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Badge.tsx
│   │   ├── Navbar.tsx           # Navigation bar
│   │   ├── Footer.tsx           # Footer
│   │   ├── BookingCard.tsx      # Card prenotazione
│   │   ├── CancellationModal.tsx
│   │   ├── CancellationAlertBanner.tsx
│   │   ├── AddressAutocomplete.tsx
│   │   ├── ClientProvider.tsx
│   │   ├── DriverChat.tsx
│   │   ├── LanguageCurrencySelector.tsx
│   │   ├── RideMatchCard.tsx
│   │   └── TrackingMap.tsx
│   ├── lib/                     # Utility functions
│   │   ├── prisma.ts            # Prisma client
│   │   ├── auth.ts              # Helper autenticazione
│   │   ├── utils.ts             # Utilities generiche
│   │   └── mockData.ts          # Dati mock per sviluppo
│   ├── service/                 # Business logic services
│   │   └── flightMonitor.ts     # Flight tracking service
│   ├── store/                   # State management (Zustand)
│   │   └── index.ts             # Store globale
│   └── types/                   # TypeScript types
│       └── index.ts             # Type definitions
├── prisma/
│   ├── schema.prisma            # Schema database
│   └── seed.ts                  # Seed script
├── public/                      # Asset statici
├── .env.local                   # Variabili ambiente (non committare!)
├── next.config.js               # Config Next.js
├── tailwind.config.ts           # Config Tailwind
├── tsconfig.json                # Config TypeScript
├── postcss.config.js            # Config PostCSS
├── package.json                 # Dependencies
├── README.md                    # Questo file
├── API_DOCUMENTATION.md         # Docs API
├── ARCHITECTURE.md              # Architettura sistema
└── DEPLOYMENT.md                # Guida deployment
```

## 👤 Ruoli Utente

### Passeggero (`user`)
- Ricerca e prenota corse
- Visualizza dashboard personale
- Gestisce prenotazioni
- Valuta autisti
- Tracking corse in tempo reale

### Autista (`driver`)
- Riceve e gestisce richieste
- Visualizza calendario corse
- Monitora guadagni
- Aggiorna profilo e veicolo
- Chat con passeggeri

### Admin (`admin`)
- Accesso completo alla piattaforma
- Gestione utenti e autisti
- Approvazione nuovi autisti
- Analytics e report finanziari
- Monitoraggio corse real-time
- Export dati e report

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Test con coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Account di Test

**Passeggero:**
- Email: `passenger@test.com`
- Password: `Password123!`

**Autista:**
- Email: `driver@test.com`
- Password: `Password123!`

**Admin:**
- Email: `admin@flanvo.com`
- Password: `Admin123!`

## 🚢 Deployment

Consulta il file [DEPLOYMENT.md](./DEPLOYMENT.md) per istruzioni dettagliate sul deploy su:
- ✅ Vercel (Consigliato)
- ✅ AWS
- ✅ DigitalOcean
- ✅ Docker

## 📚 Documentazione Aggiuntiva

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architettura del sistema e diagrammi
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentazione API completa
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guida deployment dettagliata

## 🎯 Features Roadmap

### ✅ Implementate
- [x] Sistema autenticazione completo
- [x] Dashboard passeggero/autista/admin
- [x] Ricerca voli e prenotazione
- [x] Integrazione pagamenti Stripe
- [x] Sistema matching automatico
- [x] Flight tracking real-time
- [x] Gestione cancellazioni con rimborsi
- [x] Multi-lingua (IT/EN)
- [x] Multi-valuta (EUR/USD)

### 🚧 In Sviluppo
- [ ] App mobile iOS/Android
- [ ] Sistema di rating completo
- [ ] Chat in-app autista-passeggero
- [ ] Notifiche push
- [ ] Sistema di promozioni

### 📋 Pianificate
- [ ] Prenotazioni ricorrenti
- [ ] Gestione flotta per aziende
- [ ] API pubblica per integrazioni
- [ ] Dashboard analytics avanzata
- [ ] Sistema di loyalty program

## 🤝 Contribuire

Contributi sono sempre benvenuti! Per contribuire:

1. Fai un Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### Guidelines

- Segui lo stile di codice esistente
- Aggiungi test per nuove funzionalità
- Aggiorna la documentazione
- Descrivi chiaramente le modifiche nella PR

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 📞 Supporto

- **Email**: support@flanvo.com
- **Website**: https://flanvo.com
- **GitHub Issues**: https://github.com/ls-flanvo/FLV/issues
- **Documentation**: https://docs.flanvo.com

## 🙏 Ringraziamenti

- Next.js team per l'ottimo framework
- Vercel per l'hosting
- Stripe per l'elaborazione pagamenti
- Tutti i contributors del progetto

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/ls-flanvo/FLV)
![GitHub forks](https://img.shields.io/github/forks/ls-flanvo/FLV)
![GitHub issues](https://img.shields.io/github/issues/ls-flanvo/FLV)
![GitHub license](https://img.shields.io/github/license/ls-flanvo/FLV)

---

**Made with ❤️ by the Flanvo Team**