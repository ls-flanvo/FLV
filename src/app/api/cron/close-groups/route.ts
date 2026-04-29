import { NextRequest, NextResponse } from 'next/server';
import { checkAndCloseExpiredGroups } from '@/lib/group-ready';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await checkAndCloseExpiredGroups();
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    console.error('cron/close-groups error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
