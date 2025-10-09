export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'driver' | 'admin'; // AGGIUNTO
  createdAt?: string;
}

export interface Flight {
  id: string;
  code: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledTime: string;
  actualTime?: string;
  delayMins: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'landed' | 'cancelled' | 'delayed' | 'diverted'; // ← Aggiungi 'diverted'
  terminal?: string;
  gate?: string;
  divertedTo?: string; // ← NUOVO: aeroporto di dirottamento
}

export interface Destination {
  address: string;
  lat: number;
  lng: number;
  city: string;
}

export interface RideMatch {
  id: string;
  flightId: string;
  passengers: User[];
  destinations: Destination[];
  totalPrice: number;
  pricePerPerson: number;
  estimatedDuration: number;
  maxDeviation: number;
  vehicleType: string;
  departureTime: string;
  seats: number;
  score: number;
}

export interface RideGroup {
  id: string;
  flightId: string;
  passengers: string[];
  destinations: Destination[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  vehicleId?: string;
  driverId?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  rideGroupId: string;
  userId: string;
  sharePrice: number;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
  destination: Destination;
  createdAt: string;
  flight: Flight;
  rideGroup?: RideGroup;
}

export interface Vehicle {
  id: string;
  driverId: string;
  brand: string;
  model: string;
  seats: number;
  plate: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  type: 'sedan' | 'suv' | 'van';
}

export interface DriverRide {
  id: string;
  rideGroupId: string;
  flight: Flight;
  passengers: User[];
  destinations: Destination[];
  totalPrice: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  pickupTime: string;
}