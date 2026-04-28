import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(params.token, secret);

    if (payload.type !== 'verify-email' || !payload.userId)
      return NextResponse.redirect(new URL('/login?error=token-invalid', req.url));

    await prisma.user.update({
      where: { id: payload.userId as string },
      data: { isVerified: true },
    });

    return NextResponse.redirect(new URL('/dashboard?verified=1', req.url));
  } catch {
    return NextResponse.redirect(new URL('/login?error=token-expired', req.url));
  }
}
