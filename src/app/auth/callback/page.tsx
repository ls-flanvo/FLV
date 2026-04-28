'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const { login, setToken } = useAuthStore();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const role = params.get('role');
    if (!token) { router.push('/login?error=oauth-failed'); return; }

    // Decodifica il payload dal JWT (solo la parte pubblica)
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const user = { id: payload.userId, email: payload.email, name: payload.email?.split('@')[0] || '', role: role || 'user' };
      login(user as Parameters<typeof login>[0]);
      setToken(token);
      localStorage.setItem('flanvo_token', token);
      localStorage.setItem('flanvo_user', JSON.stringify(user));
    } catch { /* */ }

    const dest = role === 'driver' ? '/driver/dashboard' : role === 'admin' ? '/admin/dashboard' : '/dashboard';
    router.push(dest);
  }, [params, login, setToken, router]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
        <p className="text-ink-secondary text-sm">Accesso in corso...</p>
      </div>
    </div>
  );
}
