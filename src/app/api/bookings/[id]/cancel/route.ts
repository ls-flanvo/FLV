import { NextRequest, NextResponse } from 'next/server';

// src/app/api/bookings/[id]/cancel/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { refundEligible } = await request.json();
    const bookingId = params.id;

    // Mock logic - sostituire con logica database reale
    console.log('Cancelling booking:', bookingId);
    console.log('Refund eligible:', refundEligible);

    // Qui implementare:
    // 1. Verificare che la prenotazione esista
    // 2. Verificare lo stato del volo per confermare eligibilità rimborso
    // 3. Aggiornare stato prenotazione a 'cancelled'
    // 4. Se refundEligible = true, creare richiesta rimborso
    // 5. Notificare altri passeggeri della corsa
    // 6. Notificare il driver
    // 7. Aggiornare disponibilità posti nella corsa condivisa

    const mockResponse = {
      success: true,
      booking: {
        id: bookingId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        refundStatus: refundEligible ? 'processing' : 'not_eligible',
        refundAmount: refundEligible ? 45.00 : 0,
        refundMethod: 'original_payment_method',
        refundETA: refundEligible ? '5-7 giorni lavorativi' : null
      },
      message: refundEligible 
        ? 'Prenotazione cancellata con successo. Il rimborso verrà elaborato entro 5-7 giorni lavorativi.'
        : 'Prenotazione cancellata. Nessun rimborso previsto per cancellazioni volontarie.'
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Errore durante la cancellazione' },
      { status: 500 }
    );
  }
}

// GET per verificare eligibilità rimborso prima della cancellazione
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    // Mock logic - sostituire con query database reale
    const mockBooking = {
      id: bookingId,
      flightStatus: 'scheduled', // o 'cancelled', 'diverted'
      cancellationPolicy: {
        refundEligible: false, // true solo se volo cancelled/diverted
        reason: 'voluntary_cancellation',
        refundPercentage: 0,
        warnings: [
          'Le cancellazioni volontarie non prevedono rimborso',
          'Questa azione è irreversibile'
        ]
      }
    };

    return NextResponse.json(mockBooking);

  } catch (error) {
    console.error('Error checking cancellation policy:', error);
    return NextResponse.json(
      { error: 'Errore durante il controllo della policy' },
      { status: 500 }
    );
  }
}