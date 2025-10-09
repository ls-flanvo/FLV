import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/lib/types';

let bookings: Booking[] = [];

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    await new Promise(resolve => setTimeout(resolve, 300));

    if (userId) {
      const userBookings = bookings.filter(b => b.userId === userId);
      return NextResponse.json({ bookings: userBookings });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel recupero delle prenotazioni' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    await new Promise(resolve => setTimeout(resolve, 500));

    const newBooking: Booking = {
      id: 'booking-' + Date.now(),
      ...bookingData,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);

    return NextResponse.json({ booking: newBooking });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nella creazione della prenotazione' },
      { status: 500 }
    );
  }
}