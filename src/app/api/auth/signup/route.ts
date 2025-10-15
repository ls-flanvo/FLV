import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    await new Promise(resolve => setTimeout(resolve, 500));

    const newUser: User = {
      id: 'user-' + Date.now(),
      name,
      email,
      role: 'PASSENGER',  // ✅ CORRETTO (enum UserRole)
    };

    return NextResponse.json({
      user: newUser,
      token: 'mock-jwt-token-' + newUser.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}