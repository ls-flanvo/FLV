'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const storedUser = localStorage.getItem('flanvo_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUser(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('flanvo_user');
      }
    }
  }, [setUser]);

  return <>{children}</>;
}