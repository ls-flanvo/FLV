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
  arrivalAirportName?: string;
  arrivalLat?: number | null;
  arrivalLng?: number | null;
  scheduledTime: string;
  actualTime?: string;
  delayMins: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'landed' | 'cancelled' | 'delayed' | 'diverted';
  terminal?: string;
  gate?: string;
  divertedTo?: string;
}

export interface Destination {
  address: string;
  lat: number;
  lng: number;
  city: string;
}

export interface RideMatch {
  id: string;
  memberId?: string;
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
  totalPassengers: number;
  estimatedKm: number;
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
  userId: string;
  // Location
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  pickupTime: string;
  // Flight
  flightNumber: string;
  flightDate: string;
  direction: 'TO_AIRPORT' | 'FROM_AIRPORT';
  // Passengers
  passengers: number;
  luggage: number;
  luggageCount?: number;
  passengerName?: string;
  // Pricing
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  // Status
  status: 'PENDING' | 'CONFIRMED' | 'IN_MATCHING' | 'MATCHED' | 'NO_MATCH' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  userRating?: number | null;
  ratingComment?: string | null;
  createdAt: string;
  updatedAt?: string;
  // Relations (optional, from API includes)
  groupMember?: {
    id: string;
    rideGroupId: string;
    totalPrice?: number | null;
    paymentStatus?: string;
    paymentIntentId?: string | null;
    rideGroup?: { id: string; status: string; qualityScore?: number | null; totalPrice?: number | null; currentCapacity?: number | null; maxCapacity?: number | null; flightStatus?: string | null; meetingPoint?: string | null; noShowAvailableAt?: string | null; members?: Array<{ id: string; booking: { passengerName: string; passengers: number } }> };
  } | null;
  // Legacy compat
  sharePrice?: number;
  rideGroupId?: string;
  destination?: Destination;
  flight?: Flight;
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