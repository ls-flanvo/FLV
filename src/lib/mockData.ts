import { User, Flight, RideGroup, Booking, Vehicle, Destination } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Marco Rossi',
    email: 'marco.rossi@email.com',
    role: 'user',
  },
  {
    id: '2',
    name: 'Laura Bianchi',
    email: 'laura.bianchi@email.com',
    role: 'user',
  },
  {
    id: '3',
    name: 'Giuseppe Verdi',
    email: 'giuseppe.verdi@email.com',
    role: 'user',
  },
  {
    id: 'driver1',
    name: 'Antonio Esposito',
    email: 'antonio.driver@email.com',
    role: 'driver',
  },
  {
    id: 'admin1',
    name: 'Admin Flanvo',
    email: 'admin@flanvo.com',
    role: 'admin',
  },
];

// Aeroporti target MVP: CTA (Catania), PMO (Palermo), CAG (Cagliari)
export const mockFlights: Flight[] = [
  {
    id: 'f1',
    code: 'FR9901',
    airline: 'Ryanair',
    departureAirport: 'LGW',
    arrivalAirport: 'CTA',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    delayMins: 0,
    status: 'scheduled',
    terminal: '1',
    gate: 'A3',
  },
  {
    id: 'f2',
    code: 'VY6134',
    airline: 'Vueling',
    departureAirport: 'BCN',
    arrivalAirport: 'PMO',
    scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    delayMins: 0,
    status: 'scheduled',
    terminal: '1',
    gate: 'B7',
  },
  {
    id: 'f3',
    code: 'W63301',
    airline: 'Wizz Air',
    departureAirport: 'MXP',
    arrivalAirport: 'CAG',
    scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    delayMins: 20,
    status: 'delayed',
    terminal: '1',
    gate: 'C2',
  },
  {
    id: 'f4',
    code: 'AZ1580',
    airline: 'ITA Airways',
    departureAirport: 'FCO',
    arrivalAirport: 'CTA',
    scheduledTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    delayMins: 0,
    status: 'scheduled',
    terminal: '2',
    gate: 'D4',
  },
];

// Destinazioni reali nei corridoi target
export const mockDestinations: Destination[] = [
  {
    address: 'Via Etnea 250, Catania, 95131',
    lat: 37.5079,
    lng: 15.0830,
    city: 'Catania',
  },
  {
    address: 'Via della Libertà 22, Palermo, 90143',
    lat: 38.1157,
    lng: 13.3615,
    city: 'Palermo',
  },
  {
    address: 'Taormina, Messina, 98039',
    lat: 37.8525,
    lng: 15.2867,
    city: 'Taormina',
  },
  {
    address: 'Villasimius, Cagliari, 09049',
    lat: 39.1183,
    lng: 9.5147,
    city: 'Villasimius',
  },
  {
    address: 'Siracusa, 96100',
    lat: 37.0755,
    lng: 15.2866,
    city: 'Siracusa',
  },
];

export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    driverId: 'driver1',
    brand: 'Mercedes',
    model: 'E-Class',
    seats: 4,
    plate: 'AB123CD',
    currentLocation: { lat: 45.6301, lng: 8.7233 },
    type: 'sedan',
  },
  {
    id: 'v2',
    driverId: 'driver1',
    brand: 'Mercedes',
    model: 'Vito',
    seats: 7,
    plate: 'EF456GH',
    currentLocation: { lat: 37.4668, lng: 15.0644 },
    type: 'van',
  },
];

export const mockRideGroups: RideGroup[] = [
  {
    id: 'rg1',
    flightId: 'f1',
    passengers: ['1', '2'],
    destinations: [mockDestinations[0], mockDestinations[1]],
    totalPrice: 45,
    status: 'pending',
    createdAt: '2025-10-06T12:00:00Z',
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    rideGroupId: 'rg1',
    userId: '1',
    sharePrice: 22.5,
    status: 'PENDING',
    pickupLocation: 'Via Roma 1, Milano',
    pickupLat: 45.4654,
    pickupLng: 9.1859,
    dropoffLocation: 'Aeroporto Fiumicino',
    dropoffLat: 41.8003,
    dropoffLng: 12.2389,
    pickupTime: '2025-10-06T12:00:00Z',
    flightNumber: 'AZ1234',
    flightDate: '2025-10-06T12:00:00Z',
    direction: 'TO_AIRPORT',
    passengers: 1,
    luggage: 1,
    destination: mockDestinations[0],
    createdAt: '2025-10-06T12:00:00Z',
    flight: mockFlights[0],
  },
];