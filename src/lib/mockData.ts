import { User, Flight, RideGroup, Booking, Vehicle, Destination } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Marco Rossi',
    email: 'marco.rossi@email.com',
    role: 'PASSENGER',
  },
  {
    id: '2',
    name: 'Laura Bianchi',
    email: 'laura.bianchi@email.com',
    role: 'PASSENGER',
  },
  {
    id: '3',
    name: 'Giuseppe Verdi',
    email: 'giuseppe.verdi@email.com',
    role: 'PASSENGER',
  },
  {
    id: 'driver1',
    name: 'Antonio Esposito',
    email: 'antonio.driver@email.com',
    role: 'DRIVER',  // ✅ MAIUSCOLO
  },
  {
    id: 'admin1',
    name: 'Admin Flanvo',
    email: 'admin@flanvo.com',
    role: 'ADMIN',  // ✅ MAIUSCOLO
  },
];

export const mockFlights: Flight[] = [
  {
    id: 'f1',
    code: 'AZ1234',
    airline: 'ITA Airways',
    departureAirport: 'FCO',
    arrivalAirport: 'MXP',
    scheduledTime: '2025-10-07T14:30:00Z',
    actualTime: '2025-10-07T14:45:00Z',
    delayMins: 15,
    status: 'delayed',
    terminal: '1',
    gate: 'B12',
  },
  {
    id: 'f2',
    code: 'FR5678',
    airline: 'Ryanair',
    departureAirport: 'LHR',
    arrivalAirport: 'CTA',
    scheduledTime: '2025-10-07T18:20:00Z',
    delayMins: 0,
    status: 'scheduled',
    terminal: '2',
    gate: 'A5',
  },
  {
    id: 'f3',
    code: 'BA9012',
    airline: 'British Airways',
    departureAirport: 'LGW',
    arrivalAirport: 'FCO',
    scheduledTime: '2025-10-07T16:45:00Z',
    delayMins: 0,
    status: 'boarding',
    terminal: '3',
    gate: 'C8',
  },
];

export const mockDestinations: Destination[] = [
  {
    address: 'Via Roma 123, Milano, 20121',
    lat: 45.4642,
    lng: 9.1900,
    city: 'Milano',
  },
  {
    address: 'Corso Buenos Aires 45, Milano, 20124',
    lat: 45.4777,
    lng: 9.2060,
    city: 'Milano',
  },
  {
    address: 'Via Etnea 250, Catania, 95131',
    lat: 37.5079,
    lng: 15.0830,
    city: 'Catania',
  },
  {
    address: 'Piazza Duomo 1, Milano, 20122',
    lat: 45.4641,
    lng: 9.1919,
    city: 'Milano',
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
    status: 'pending',
    destination: mockDestinations[0],
    createdAt: '2025-10-06T12:00:00Z',
    flight: mockFlights[0],
  },
];