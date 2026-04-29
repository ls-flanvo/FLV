'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('flanvo_token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('flanvo_token');
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unread > 0) markAllRead();
  };

  const ctaHref = (n: Notif) => {
    if (n.type === 'GROUP_READY' && n.data?.groupMemberId)
      return `/checkout/${n.data.groupMemberId}`;
    return '/dashboard';
  };

  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 60_000;
    if (diff < 1) return 'adesso';
    if (diff < 60) return `${Math.floor(diff)}m fa`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h fa`;
    return `${Math.floor(diff / 1440)}g fa`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-ink-secondary hover:text-white hover:bg-surface-2 transition-all"
        title="Notifiche"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary-500 text-[#0B0B0B] text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-1 border border-surface-4 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-4">
            <h3 className="text-sm font-semibold text-white">Notifiche</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-primary-400 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Segna tutte lette
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-4">
            {notifs.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-8">Nessuna notifica</p>
            ) : (
              notifs.map((n) => (
                <Link
                  key={n.id}
                  href={ctaHref(n)}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 px-4 py-3 hover:bg-surface-2 transition-colors ${!n.read ? 'bg-primary-500/5' : ''}`}
                >
                  <span className="text-lg shrink-0 mt-0.5">
                    {n.type === 'GROUP_READY' ? '🎉' : n.type === 'BOOKING_CANCELLED' ? '❌' : '✅'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold mb-0.5 ${!n.read ? 'text-white' : 'text-ink-secondary'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-ink-muted line-clamp-2">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-ink-muted shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
