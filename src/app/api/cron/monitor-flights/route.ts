import { NextRequest, NextResponse } from 'next/server';
import { monitorActiveFlights } from '@/lib/flight-monitor';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await monitorActiveFlights();
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    console.error('cron/monitor-flights error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
