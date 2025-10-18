import { create } from 'zustand';
import { User, Flight, RideMatch, Booking } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null; // ✅ AGGIUNTO
  isAuthenticated: boolean;
  login: (user: User) => void;
  loginWithCredentials: (email: string, password: string, role?: string) => Promise<User>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void; // ✅ AGGIUNTO
  isRole: (role: 'user' | 'driver' | 'admin') => boolean;
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
  token: null, // ✅ AGGIUNTO
  isAuthenticated: false,

  login: (user: User) => {
    set({ user, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('flanvo_user', JSON.stringify(user));
    }
  },

  // ✅ FIXED: Salva anche il token
  loginWithCredentials: async (email: string, password: string, role?: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await response.json();
    
    if (data.user && data.token) { // ✅ Controlla anche token
      set({ 
        user: data.user, 
        token: data.token, // ✅ SALVA TOKEN
        isAuthenticated: true 
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('flanvo_user', JSON.stringify(data.user));
        localStorage.setItem('flanvo_token', data.token); // ✅ SALVA TOKEN
      }
    }
    return data.user;
  },

  // ✅ FIXED: Salva anche il token
  signup: async (name: string, email: string, password: string, role: string = 'user') => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await response.json();
    
    if (data.user && data.token) { // ✅ Controlla anche token
      set({ 
        user: data.user, 
        token: data.token, // ✅ SALVA TOKEN
        isAuthenticated: true 
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('flanvo_user', JSON.stringify(data.user));
        localStorage.setItem('flanvo_token', data.token); // ✅ SALVA TOKEN
      }
    }
    return data.user;
  },

  // ✅ FIXED: Rimuovi anche il token
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flanvo_user');
      localStorage.removeItem('flanvo_token'); // ✅ RIMUOVI TOKEN
      localStorage.removeItem('flanvo_destination');
      localStorage.removeItem('flanvo_booking_info');
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setToken: (token) => set({ token }), // ✅ NUOVO

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