'use client';

import { useEffect } from 'react';
import { useAuthStore, useBookingStore } from '@/store';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setToken } = useAuthStore();
  const { fetchBookings } = useBookingStore();

  useEffect(() => {
    const storedUser = localStorage.getItem('flanvo_user');
    const storedToken = localStorage.getItem('flanvo_token');

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setUser(user);
        setToken(storedToken);
        fetchBookings(storedToken);
      } catch {
        localStorage.removeItem('flanvo_user');
        localStorage.removeItem('flanvo_token');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
