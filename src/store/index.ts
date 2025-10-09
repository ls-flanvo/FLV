import { create } from 'zustand';
import { User, Flight, RideMatch, Booking } from '@/lib/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void; // Cambiato per accettare User direttamente
  loginWithCredentials: (email: string, password: string, role?: string) => Promise<User>; // Aggiunto ruolo
  signup: (name: string, email: string, password: string, role?: string) => Promise<User>; // Aggiunto ruolo
  logout: () => void;
  setUser: (user: User | null) => void;
  isRole: (role: 'user' | 'driver' | 'admin') => boolean; // Nuovo helper
}

interface BookingState {
  currentFlight: Flight | null;
  selectedMatch: RideMatch | null;
  bookings: Booking[];
  setCurrentFlight: (flight: Flight | null) => void;
  setSelectedMatch: (match: RideMatch | null) => void;
  addBooking: (booking: Booking) => void;
  setBookings: (bookings: Booking[]) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  // Funzione per login diretto (usata dai componenti con demo)
  login: (user: User) => {
    set({ user, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('flanvo_user', JSON.stringify(user));
    }
  },

  // Funzione per login con credenziali e ruolo
  loginWithCredentials: async (email: string, password: string, role?: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await response.json();
    
    if (data.user) {
      set({ user: data.user, isAuthenticated: true });
      if (typeof window !== 'undefined') {
        localStorage.setItem('flanvo_user', JSON.stringify(data.user));
      }
    }
    return data.user;
  },

  // Funzione per signup con ruolo
  signup: async (name: string, email: string, password: string, role: string = 'user') => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await response.json();
    
    if (data.user) {
      set({ user: data.user, isAuthenticated: true });
      if (typeof window !== 'undefined') {
        localStorage.setItem('flanvo_user', JSON.stringify(data.user));
      }
    }
    return data.user;
  },

  // Logout
  logout: () => {
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flanvo_user');
      localStorage.removeItem('flanvo_destination');
      localStorage.removeItem('flanvo_booking_info');
    }
  },

  // Imposta utente
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Helper per verificare il ruolo
  isRole: (role: 'user' | 'driver' | 'admin') => {
    const state = get();
    return state.user?.role === role;
  },
}));

export const useBookingStore = create<BookingState>((set) => ({
  currentFlight: null,
  selectedMatch: null,
  bookings: [],
  setCurrentFlight: (flight) => set({ currentFlight: flight }),
  setSelectedMatch: (match) => set({ selectedMatch: match }),
  addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
  setBookings: (bookings) => set({ bookings }),
}));