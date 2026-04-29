const IT_LOCALE = 'it-IT';
const IT_TZ = 'Europe/Rome';

export function formatFlightTime(iso: string | null | undefined, opts?: { showDate?: boolean; showTZ?: boolean }): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';

  const timePart = d.toLocaleTimeString(IT_LOCALE, {
    hour: '2-digit', minute: '2-digit', timeZone: IT_TZ,
  });

  if (opts?.showDate) {
    const datePart = d.toLocaleDateString(IT_LOCALE, {
      day: 'numeric', month: 'short', timeZone: IT_TZ,
    });
    return `${datePart} · ${timePart}${opts.showTZ ? ' (ora italiana)' : ''}`;
  }
  return `${timePart}${opts?.showTZ ? ' (ora italiana)' : ''}`;
}

export function formatDelay(mins: number | null | undefined): string | null {
  if (!mins || mins < 5) return null;
  if (mins < 60) return `+${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `+${h}h ${m}m` : `+${h}h`;
}

export function minutesUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / 60_000);
}

export function formatCountdown(iso: string | null | undefined): string {
  const mins = minutesUntil(iso);
  if (mins === null) return '—';
  if (mins < 0) return 'Passato';
  if (mins < 60) return `tra ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `tra ${h}h ${m}m` : `tra ${h}h`;
}
