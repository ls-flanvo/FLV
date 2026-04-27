import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/jwt';

function mapRole(prismaRole: string): 'user' | 'driver' | 'admin' {
  if (prismaRole === 'DRIVER') return 'driver';
  if (prismaRole === 'ADMIN') return 'admin';
  return 'user';
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        driver: { select: { isVerified: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    if (user.role === 'DRIVER' && user.driver && !user.driver.isVerified) {
      return NextResponse.json(
        { error: 'Account in attesa di approvazione admin' },
        { status: 403 }
      );
    }

    const role = mapRole(user.role);
    const token = await generateToken({ userId: user.id, email: user.email, role });

    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
    };

    const response = NextResponse.json({
      user: responseUser,
      token,
      message: 'Login effettuato con successo',
    });

    response.cookies.set('flanvo_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Errore durante il login' }, { status: 500 });
  }
}
