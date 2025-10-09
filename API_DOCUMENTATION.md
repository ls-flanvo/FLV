# 📡 Flanvo API Documentation

Documentazione completa delle API REST di Flanvo.

## 📋 Indice

- [Panoramica](#panoramica)
- [Autenticazione](#autenticazione)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Bookings](#bookings)
  - [Flights](#flights)
  - [Drivers](#drivers)
  - [Tracking](#tracking)
  - [Matching](#matching)
- [Codici di Errore](#codici-di-errore)
- [Rate Limiting](#rate-limiting)

## 🎯 Panoramica

**Base URL**: `https://your-domain.com/api`

**Formato**: Tutte le richieste e risposte sono in formato JSON

**Autenticazione**: JWT token in HTTP-only cookie

## 🔐 Autenticazione

Tutte le API protette richiedono un JWT token valido. Il token viene impostato come HTTP-only cookie dopo il login.

### Headers Richiesti

```http
Content-Type: application/json
Cookie: token=<jwt-token>
```

---

## 📌 API Endpoints

## Authentication

### POST /api/auth/signup

Registrazione nuovo utente passeggero.

**Request Body:**
```json
{
  "name": "Mario Rossi",
  "email": "mario.rossi@email.com",
  "phone": "+39 333 1234567",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx123abc",
    "name": "Mario Rossi",
    "email": "mario.rossi@email.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errori:**
- `400` - Dati non validi
- `409` - Email già registrata

---

### POST /api/auth/login

Login utente (passeggero/autista/admin).

**Request Body:**
```json
{
  "email": "mario.rossi@email.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx123abc",
    "name": "Mario Rossi",
    "email": "mario.rossi@email.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errori:**
- `401` - Credenziali non valide
- `404` - Utente non trovato

---

### POST /api/auth/driver/signup

Registrazione nuovo autista.

**Request Body:**
```json
{
  "name": "Giuseppe",
  "surname": "Verdi",
  "email": "giuseppe.verdi@email.com",
  "phone": "+39 334 7654321",
  "password": "Password123!",
  "dateOfBirth": "1985-06-15",
  "taxCode": "VRDGPP85H15F205Z",
  "address": "Via Roma, 123",
  "city": "Milano",
  "province": "MI",
  "zipCode": "20100",
  "driverLicense": "MI1234567X",
  "licenseExpiry": "2027-12-31",
  "cqcNumber": "CQC9876543",
  "cqcExpiry": "2026-06-30",
  "vehicleBrand": "Mercedes-Benz",
  "vehicleModel": "Classe E",
  "vehicleYear": "2022",
  "licensePlate": "AB123CD",
  "vehicleColor": "Nero",
  "seats": "4",
  "insuranceCompany": "Generali",
  "insuranceNumber": "POL123456789",
  "insuranceExpiry": "2025-12-31",
  "availability": "fulltime"
}
```

**Response (201):**
```json
{
  "message": "Candidatura inviata con successo. In attesa di approvazione.",
  "driverId": "clx456def"
}
```

---

## Bookings

### GET /api/bookings

Recupera le prenotazioni dell'utente autenticato.

**Query Parameters:**
- `status` (optional): `pending`, `confirmed`, `completed`, `cancelled`
- `limit` (optional): numero di risultati (default: 10)
- `offset` (optional): offset per paginazione (default: 0)

**Response (200):**
```json
{
  "bookings": [
    {
      "id": "clx789ghi",
      "bookingCode": "FLV-2024-001",
      "status": "confirmed",
      "flightNumber": "AZ1234",
      "flightDate": "2024-10-15",
      "flightTime": "14:30",
      "pickupAddress": "Aeroporto di Catania-Fontanarossa",
      "dropoffAddress": "Via Roma 123, Messina",
      "pickupTime": "2024-10-15T14:30:00Z",
      "passengers": 2,
      "luggage": 2,
      "totalPrice": 185.50,
      "paymentStatus": "paid",
      "createdAt": "2024-10-08T10:15:00Z",
      "driver": {
        "name": "Giuseppe Verdi",
        "phone": "+39 334 7654321",
        "vehicle": "Mercedes Classe E",
        "licensePlate": "AB123CD"
      }
    }
  ],
  "total": 12,
  "hasMore": true
}
```

---

### POST /api/bookings

Crea una nuova prenotazione.

**Request Body:**
```json
{
  "flightNumber": "AZ1234",
  "flightDate": "2024-10-15",
  "flightTime": "14:30",
  "pickupAddress": "Aeroporto di Catania-Fontanarossa",
  "pickupAirport": "Catania (CTA)",
  "dropoffAddress": "Via Roma 123, 98100 Messina, ME",
  "pickupTime": "2024-10-15T14:30:00Z",
  "passengers": 2,
  "luggage": 2,
  "notes": "Volo internazionale, necessario cartello con nome"
}
```

**Response (201):**
```json
{
  "booking": {
    "id": "clx789ghi",
    "bookingCode": "FLV-2024-001",
    "status": "pending",
    "totalPrice": 185.50,
    "paymentUrl": "https://checkout.stripe.com/..."
  }
}
```

---

### POST /api/bookings/[id]/cancel

Cancella una prenotazione.

**Request Body:**
```json
{
  "refundEligible": true
}
```

**Response (200):**
```json
{
  "message": "Prenotazione cancellata con successo",
  "refundAmount": 185.50,
  "refundStatus": "pending"
}
```

**Errori:**
- `404` - Prenotazione non trovata
- `400` - Prenotazione non cancellabile (già completata o in corso)

---

## Flights

### GET /api/flights/[code]

Recupera informazioni su un volo specifico.

**Path Parameters:**
- `code`: Codice volo (es: AZ1234)

**Query Parameters:**
- `date` (optional): Data volo in formato YYYY-MM-DD

**Response (200):**
```json
{
  "flight": {
    "flightNumber": "AZ1234",
    "airline": "Alitalia",
    "departure": {
      "airport": "FCO",
      "city": "Roma",
      "terminal": "3",
      "scheduledTime": "2024-10-15T10:00:00Z",
      "estimatedTime": "2024-10-15T10:15:00Z"
    },
    "arrival": {
      "airport": "CTA",
      "city": "Catania",
      "terminal": "1",
      "scheduledTime": "2024-10-15T11:30:00Z",
      "estimatedTime": "2024-10-15T11:30:00Z"
    },
    "status": "scheduled",
    "aircraft": "A320"
  }
}
```

**Status possibili:**
- `scheduled` - Programmato
- `active` - In volo
- `landed` - Atterrato
- `cancelled` - Cancellato
- `diverted` - Dirottato
- `delayed` - Ritardato

**Errori:**
- `404` - Volo non trovato
- `400` - Codice volo non valido

---

## Drivers

### GET /api/driver/rides

Recupera le corse assegnate all'autista autenticato.

**Query Parameters:**
- `status` (optional): `assigned`, `accepted`, `in_progress`, `completed`
- `date` (optional): Data in formato YYYY-MM-DD

**Response (200):**
```json
{
  "rides": [
    {
      "id": "clxabc123",
      "bookingCode": "FLV-2024-001",
      "status": "assigned",
      "passenger": {
        "name": "Mario Rossi",
        "phone": "+39 333 1234567"
      },
      "pickup": {
        "address": "Aeroporto di Catania-Fontanarossa",
        "time": "2024-10-15T14:30:00Z"
      },
      "dropoff": {
        "address": "Via Roma 123, Messina"
      },
      "flightNumber": "AZ1234",
      "passengers": 2,
      "luggage": 2,
      "driverEarnings": 148.40,
      "notes": "Volo internazionale"
    }
  ],
  "earnings": {
    "today": 296.80,
    "week": 1482.00,
    "month": 5928.00
  }
}
```

---

### POST /api/driver/rides/[id]/accept

Autista accetta una corsa assegnata.

**Response (200):**
```json
{
  "message": "Corsa accettata con successo",
  "ride": {
    "id": "clxabc123",
    "status": "accepted",
    "acceptedAt": "2024-10-14T09:30:00Z"
  }
}
```

---

### POST /api/driver/rides/[id]/start

Autista inizia la corsa.

**Response (200):**
```json
{
  "message": "Corsa iniziata",
  "ride": {
    "id": "clxabc123",
    "status": "in_progress",
    "startedAt": "2024-10-15T14:30:00Z"
  }
}
```

---

### POST /api/driver/rides/[id]/complete

Autista completa la corsa.

**Request Body:**
```json
{
  "notes": "Corsa completata senza problemi"
}
```

**Response (200):**
```json
{
  "message": "Corsa completata",
  "ride": {
    "id": "clxabc123",
    "status": "completed",
    "completedAt": "2024-10-15T15:45:00Z",
    "earnings": 148.40
  }
}
```

---

## Tracking

### GET /api/tracking/[id]

Tracciamento real-time di una corsa in corso.

**Path Parameters:**
- `id`: ID della prenotazione

**Response (200):**
```json
{
  "ride": {
    "id": "clxabc123",
    "status": "in_progress",
    "driver": {
      "name": "Giuseppe Verdi",
      "phone": "+39 334 7654321",
      "vehicle": "Mercedes Classe E - AB123CD",
      "location": {
        "lat": 37.5079,
        "lng": 15.0830
      }
    },
    "pickup": {
      "address": "Aeroporto di Catania-Fontanarossa",
      "time": "2024-10-15T14:30:00Z"
    },
    "dropoff": {
      "address": "Via Roma 123, Messina"
    },
    "estimatedArrival": "2024-10-15T15:45:00Z",
    "distance": {
      "total": 98.5,
      "remaining": 45.2
    }
  }
}
```

**Errori:**
- `404` - Corsa non trovata
- `403` - Non autorizzato a visualizzare questo tracking

---

## Matching

### POST /api/matching

Sistema di matching automatico tra prenotazioni e autisti disponibili.

**Request Body:**
```json
{
  "bookingId": "clx789ghi"
}
```

**Response (200):**
```json
{
  "matches": [
    {
      "driverId": "clx456def",
      "driver": {
        "name": "Giuseppe Verdi",
        "rating": 4.8,
        "completedRides": 342,
        "vehicle": "Mercedes Classe E",
        "licensePlate": "AB123CD"
      },
      "distance": 5.2,
      "estimatedArrival": 12,
      "score": 95
    }
  ],
  "autoAssigned": true,
  "assignedDriver": "clx456def"
}
```

---

## 🚨 Codici di Errore

### Errori Standard

```json
{
  "error": "Messaggio di errore",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Codici Comuni

| Codice | Significato |
|--------|-------------|
| `400` | Bad Request - Dati non validi |
| `401` | Unauthorized - Token mancante o non valido |
| `403` | Forbidden - Permessi insufficienti |
| `404` | Not Found - Risorsa non trovata |
| `409` | Conflict - Conflitto (es: email già esistente) |
| `422` | Unprocessable Entity - Validazione fallita |
| `429` | Too Many Requests - Rate limit superato |
| `500` | Internal Server Error - Errore del server |

### Esempi di Errori

**Validazione fallita (422):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Email non valida",
    "password": "La password deve essere almeno 8 caratteri"
  }
}
```

**Non autorizzato (401):**
```json
{
  "error": "Token non valido o scaduto",
  "code": "INVALID_TOKEN"
}
```

---

## ⚡ Rate Limiting

### Limiti Generali

- **Rate Limit**: 100 richieste per minuto per IP
- **Header Response**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1634567890
  ```

### Limiti Specifici

| Endpoint | Limite |
|----------|--------|
| `/api/auth/login` | 5 tentativi / 15 minuti |
| `/api/auth/signup` | 3 registrazioni / ora |
| `/api/flights/*` | 30 richieste / minuto |
| `/api/tracking/*` | 60 richieste / minuto |

### Risposta Rate Limit Superato (429)

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## 🧪 Testing

### Base URL Test Environment

```
https://test.flanvo.com/api
```

### Credenziali Test

**Passeggero:**
```
Email: test.passenger@flanvo.com
Password: Test123!
```

**Autista:**
```
Email: test.driver@flanvo.com
Password: Test123!
```

**Admin:**
```
Email: test.admin@flanvo.com
Password: Admin123!
```

---

## 📞 Supporto

Per problemi con le API:
- **Email**: api-support@flanvo.com
- **Documentazione**: https://docs.flanvo.com
- **Status Page**: https://status.flanvo.com