'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store';

export default function PushSetup() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;

        // Controlla se già subscribed
        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // già registrato

        // Recupera VAPID public key
        const res = await fetch('/api/push');
        const { publicKey } = await res.json();
        if (!publicKey) return;

        // Chiedi permesso
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Crea subscription
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Invia al server
        const token = localStorage.getItem('flanvo_token');
        await fetch('/api/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch { /* silenzioso — non bloccare l'app */ }
    };

    // Ritarda di 3s per non disturbare al primo carico
    const t = setTimeout(setup, 3000);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
