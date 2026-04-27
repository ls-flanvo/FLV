import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/jwt';
import { sendWelcome } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || '',
        email,
        password: hashedPassword,
        phone: '',
        role: 'PASSENGER',
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = await generateToken({ userId: user.id, email: user.email, role: 'user' });

    const responseUser = { id: user.id, email: user.email, name: user.name, role: 'user' as const };

    const response = NextResponse.json({
      user: responseUser,
      token,
      message: 'Registrazione completata con successo',
    });

    response.cookies.set('flanvo_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // Email di benvenuto (non bloccante)
    sendWelcome(user.email, user.name || 'Utente').catch(() => {});

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Errore durante la registrazione' }, { status: 500 });
  }
}
