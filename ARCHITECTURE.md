# 🏗️ Architettura Flanvo

Questo documento descrive l'architettura tecnica della piattaforma Flanvo, inclusi diagrammi, flussi di dati e decisioni di design.

## 📋 Indice

- [Panoramica](#panoramica)
- [Architettura High-Level](#architettura-high-level)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Schema](#database-schema)
- [Flussi Principali](#flussi-principali)
- [Sicurezza](#sicurezza)
- [Scalabilità](#scalabilità)

## 🎯 Panoramica

Flanvo è costruita con un'architettura moderna basata su:
- **Frontend**: Next.js 14 con App Router (React 18 + TypeScript)
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL con Prisma ORM
- **State Management**: Zustand per lo stato globale
- **Styling**: Tailwind CSS

### Principi di Design

1. **Separation of Concerns**: Separazione netta tra frontend, business logic e data layer
2. **Type Safety**: TypeScript end-to-end per ridurre errori
3. **Component-Based**: Architettura a componenti riutilizzabili
4. **API-First**: API REST ben documentate
5. **Responsive Design**: Mobile-first approach

## 🏛️ Architettura High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Web App  │  │ Mobile   │  │ Admin    │  │ Driver   │   │
│  │ (Next.js)│  │ (Future) │  │ Panel    │  │ Panel    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             Next.js App Router                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │
│  │  │ Pages   │  │ API     │  │ Server  │            │   │
│  │  │ (RSC)   │  │ Routes  │  │ Actions │            │   │
│  │  └─────────┘  └─────────┘  └─────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth     │  │ Bookings │  │ Payments │  │ Flights  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Prisma ORM                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↕                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           PostgreSQL Database                        │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │   │
│  │  │Users │  │Booking│  │Drivers│  │Rides │           │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Stripe   │  │ Aviation │  │ Mapbox   │  │ AWS S3   │   │
│  │ Payments │  │ Stack    │  │ Maps     │  │ Storage  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Component Structure

```
src/components/
├── ui/                    # Componenti base riutilizzabili
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   └── Modal.tsx
├── layout/               # Componenti layout
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Sidebar.tsx
├── booking/              # Componenti booking
│   ├── BookingCard.tsx
│   ├── BookingForm.tsx
│   └── BookingList.tsx
├── flight/               # Componenti ricerca voli
│   ├── FlightSearch.tsx
│   └── FlightResults.tsx
└── shared/               # Componenti condivisi
    ├── Loading.tsx
    ├── ErrorBoundary.tsx
    └── ProtectedRoute.tsx
```

### State Management (Zustand)

```typescript
// src/store/index.ts
interface AppState {
  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  
  // Booking State
  currentBooking: Booking | null;
  setCurrentBooking: (booking) => void;
  
  // UI State
  locale: 'it' | 'en';
  currency: 'EUR' | 'USD';
  setLocale: (locale) => void;
  setCurrency: (currency) => void;
}
```

### Routing Structure

```
app/
├── (public)/            # Route pubbliche
│   ├── page.tsx         # Homepage
│   ├── about/
│   └── contact/
├── (auth)/              # Route autenticazione
│   ├── login/
│   └── signup/
├── dashboard/           # Dashboard passeggero
├── driver/              # Area autista
│   ├── dashboard/
│   ├── rides/
│   └── earnings/
├── admin/               # Area admin
│   ├── dashboard/
│   ├── users/
│   ├── drivers/
│   └── reports/
└── api/                 # API Routes
    ├── auth/
    ├── bookings/
    ├── flights/
    └── payments/
```

## ⚙️ Backend Architecture

### API Routes Structure

```
app/api/
├── auth/
│   ├── login/route.ts           # POST /api/auth/login
│   ├── signup/route.ts          # POST /api/auth/signup
│   ├── logout/route.ts          # POST /api/auth/logout
│   └── me/route.ts              # GET /api/auth/me
├── bookings/
│   ├── route.ts                 # GET, POST /api/bookings
│   ├── [id]/
│   │   ├── route.ts             # GET, PUT, DELETE /api/bookings/:id
│   │   └── cancel/route.ts      # POST /api/bookings/:id/cancel
├── flights/
│   └── search/route.ts          # GET /api/flights/search
├── payments/
│   ├── create-intent/route.ts   # POST /api/payments/create-intent
│   └── confirm/route.ts         # POST /api/payments/confirm
├── drivers/
│   ├── route.ts                 # GET, POST /api/drivers
│   └── [id]/
│       ├── approve/route.ts     # POST /api/drivers/:id/approve
│       └── reject/route.ts      # POST /api/drivers/:id/reject
└── webhooks/
    └── stripe/route.ts          # POST /api/webhooks/stripe
```

### Middleware Stack

```
Request
   ↓
┌──────────────────┐
│ CORS Middleware  │ → Gestione CORS
└──────────────────┘
   ↓
┌──────────────────┐
│ Auth Middleware  │ → Verifica JWT token
└──────────────────┘
   ↓
┌──────────────────┐
│ Rate Limiting    │ → Protezione DDoS
└──────────────────┘
   ↓
┌──────────────────┐
│ Error Handler    │ → Gestione errori
└──────────────────┘
   ↓
Response
```

## 🗄️ Database Schema

### Schema Prisma

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  phone     String?
  role      Role     @default(USER)
  password  String
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  bookings  Booking[]
  driver    Driver?
  
  @@map("users")
}

enum Role {
  USER
  DRIVER
  ADMIN
}

model Driver {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // Documenti
  licenseNumber   String
  licenseExpiry   DateTime
  cqcNumber       String
  cqcExpiry       DateTime
  
  // Veicolo
  vehicleBrand    String
  vehicleModel    String
  vehicleYear     Int
  licensePlate    String
  vehicleColor    String
  seats           Int
  
  // Assicurazione
  insuranceCompany String
  insuranceNumber  String
  insuranceExpiry  DateTime
  
  // Status
  status          DriverStatus @default(PENDING)
  approved        Boolean      @default(false)
  approvedAt      DateTime?
  
  availability    String       @default("fulltime")
  
  rides           Ride[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@map("drivers")
}

enum DriverStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

model Booking {
  id              String        @id @default(cuid())
  bookingCode     String        @unique
  
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  
  // Dettagli volo
  flightNumber    String?
  flightDate      DateTime?
  flightTime      String?
  
  // Pickup & Dropoff
  pickupAddress   String
  pickupAirport   String?
  dropoffAddress  String
  pickupTime      DateTime
  
  // Passeggeri
  passengers      Int           @default(1)
  luggage         Int           @default(0)
  
  // Pricing
  basePrice       Float
  platformFee     Float
  totalPrice      Float
  
  // Status
  status          BookingStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  
  // Cancellation
  cancelled       Boolean       @default(false)
  cancelledAt     DateTime?
  refundEligible  Boolean       @default(false)
  
  // Ride relation
  ride            Ride?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model Ride {
  id              String      @id @default(cuid())
  bookingId       String      @unique
  booking         Booking     @relation(fields: [bookingId], references: [id])
  
  driverId        String
  driver          Driver      @relation(fields: [driverId], references: [id])
  
  status          RideStatus  @default(ASSIGNED)
  
  startedAt       DateTime?
  completedAt     DateTime?
  
  driverEarnings  Float
  platformFee     Float
  
  rating          Int?
  review          String?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@map("rides")
}

enum RideStatus {
  ASSIGNED
  ACCEPTED
  EN_ROUTE
  ARRIVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### Diagramma ER

```
┌──────────┐         ┌──────────┐
│  User    │ 1 ── * │ Booking  │
│          │         │          │
│ id       │         │ userId   │
│ email    │         │ status   │
│ name     │         │ ...      │
│ role     │         └──────────┘
└──────────┘              │
     │ 1                  │ 1
     │                    │
     │ 1              ┌───┴────┐
     │                │  Ride  │
┌────┴────┐           │        │
│ Driver  │ * ─────── │ driverId
│         │           │ status │
│ userId  │           │ rating │
│ vehicle │           └────────┘
│ status  │
└─────────┘
```

## 🔄 Flussi Principali

### 1. Flusso Prenotazione

```
Passeggero                    Sistema                      Autista
    │                           │                             │
    ├─ Cerca volo ──────────────>│                             │
    │                           │                             │
    │<──── Mostra risultati ────┤                             │
    │                           │                             │
    ├─ Compila form ────────────>│                             │
    │                           │                             │
    ├─ Conferma prenotazione ───>│                             │
    │                           │                             │
    │                           ├─ Crea booking               │
    │                           │                             │
    │                           ├─ Processa pagamento         │
    │                           │  (Stripe)                   │
    │                           │                             │
    │<──── Email conferma ──────┤                             │
    │                           │                             │
    │                           ├─ Assegna autista ───────────>│
    │                           │                             │
    │                           │<──── Accetta corsa ─────────┤
    │                           │                             │
    │<──── Dati autista ────────┤                             │
    │                           │                             │
    │                           │