import { NextRequest, NextResponse } from 'next/server';
import { mockUsers } from '@/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user,
      token: 'mock-jwt-token-' + user.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}