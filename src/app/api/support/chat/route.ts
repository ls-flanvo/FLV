import { NextRequest, NextResponse } from 'next/server';
import { anthropic, FLANVO_SYSTEM } from '@/lib/claude';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 20 msg/ora per IP (autenticati o no)
    const ip = getClientIp(req);
    if (!rateLimit(`chat:${ip}`, 20, 60 * 60_000)) {
      return NextResponse.json({ error: 'Troppi messaggi. Riprova tra un po\'.' }, { status: 429 });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages richiesti' }, { status: 400 });
    }

    // Arricchisce il contesto con i dati reali dell'utente se autenticato
    let userContext = '';
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('flanvo_token')?.value;
    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload?.userId) {
          const bookings = await prisma.booking.findMany({
            where: { userId: payload.userId as string },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              groupMember: {
                include: {
                  rideGroup: {
                    include: { ride: { include: { driver: { include: { user: { select: { name: true } } } } } } },
                  },
                },
              },
            },
          });
          if (bookings.length > 0) {
            userContext = `\n\nDati reali dell'utente:\n`;
            bookings.forEach((b, i) => {
              const group = b.groupMember?.rideGroup;
              const driver = group?.ride?.driver?.user?.name;
              userContext += `Booking ${i + 1}: stato=${b.status}`;
              if (group) userContext += `, gruppo=${group.status}, posti=${group.currentCapacity}/${group.maxCapacity}`;
              if (driver) userContext += `, autista=${driver}`;
              userContext += '\n';
            });
          }
        }
      } catch { /* utente non autenticato, nessun contesto aggiuntivo */ }
    }

    const system = FLANVO_SYSTEM + userContext;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply: text });
  } catch (e) {
    console.error('Support chat error:', e);
    return NextResponse.json({ error: 'Errore del servizio' }, { status: 500 });
  }
}
