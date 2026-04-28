import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { description, flightAirport } = await req.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Descrizione richiesta' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: `Sei un assistente che converte descrizioni di luoghi in indirizzi italiani precisi per una ricerca su Mapbox.
Restituisci SOLO l'indirizzo/query da cercare, senza spiegazioni.
Esempio input: "vicino alla stazione centrale di Milano" → "Stazione Centrale, Milano, Italia"
Esempio input: "zona università Catania" → "Università degli Studi di Catania, Catania, Italia"
Sii specifico, includi sempre città e Italia.${flightAirport ? ` L'utente arriva all'aeroporto di ${flightAirport}.` : ''}`,
      messages: [{ role: 'user', content: description }],
    });

    const query = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return NextResponse.json({ query });
  } catch (e) {
    console.error('Address AI error:', e);
    return NextResponse.json({ error: 'Errore del servizio' }, { status: 500 });
  }
}
