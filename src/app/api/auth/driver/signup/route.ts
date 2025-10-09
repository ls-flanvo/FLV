import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Qui andrà la logica per salvare il driver in attesa di approvazione
    // Per ora ritorniamo un successo
    
    console.log('Driver signup request:', data);
    
    // TODO: Salvare nel database con status 'pending'
    
    return NextResponse.json({ 
      success: true,
      message: 'Candidatura ricevuta. In attesa di approvazione.' 
    });
    
  } catch (error) {
    console.error('Driver signup error:', error);
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    );
  }
}