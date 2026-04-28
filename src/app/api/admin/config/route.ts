import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';

const DEFAULT_CONFIG = {
  driver_rate_per_km: '2.00',
  flanvo_tier1_rate: '0.30',
  flanvo_tier2_rate: '0.25',
  flanvo_tier3_rate: '0.20',
  protection_fee: '2.50',
  min_group_size: '2',
  max_group_size: '7',
  matching_window_hours: '48',
  dbscan_eps_km: '8.5',
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const entries = await prisma.systemConfig.findMany();
    const config: Record<string, string> = { ...DEFAULT_CONFIG };
    for (const entry of entries) {
      config[entry.key] = entry.value;
    }

    return NextResponse.json({ config });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const updates: Record<string, string> = await request.json();

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
