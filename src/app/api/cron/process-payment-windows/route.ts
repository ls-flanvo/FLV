import { NextRequest, NextResponse } from 'next/server';
import { processExpiredPaymentWindows } from '@/lib/group-ready';

// Chiamato ogni 5 minuti da cron-job.org
// URL: GET /api/cron/process-payment-windows?secret=CRON_SECRET
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processExpiredPaymentWindows();
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    console.error('cron/process-payment-windows error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
