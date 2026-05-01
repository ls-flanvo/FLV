export interface AirportInfo {
  lat: number;
  lng: number;
  name: string;
  /** Punto di raccolta passeggero — dove il passeggero cammina dopo l'uscita bagagli */
  meetingPoint: string;
  /** Area di sosta NCC — dove il driver attende la notifica "sono qui" */
  nccWaitingArea: string;
  /** Minuti stimati dal parcheggio NCC al punto di raccolta */
  driverEtaMin: number;
}

export const AIRPORT_COORDS: Record<string, AirportInfo> = {
  CTA: {
    lat: 37.4668, lng: 15.0664,
    name: 'Catania Fontanarossa',
    meetingPoint: 'Uscita Arrivi — corsello esterno, lato parcheggio P1. Il driver si avvicina alla tua conferma.',
    nccWaitingArea: 'Parcheggio P1 (area NCC/minibus)',
    driverEtaMin: 5,
  },
  PMO: {
    lat: 38.1754, lng: 13.0914,
    name: 'Palermo Falcone Borsellino',
    meetingPoint: 'Uscita Arrivi — marciapiede esterno lato sinistro, area raccolta NCC.',
    nccWaitingArea: 'Parcheggio P3 (sosta breve NCC)',
    driverEtaMin: 7,
  },
  CAG: {
    lat: 39.2515, lng: 9.0543,
    name: 'Cagliari Elmas',
    meetingPoint: 'Uscita Arrivi — piazzale esterno, zona riservata NCC (segnaletica gialla).',
    nccWaitingArea: 'Piazzale NCC fronte terminal',
    driverEtaMin: 3,
  },
  FCO: {
    lat: 41.8003, lng: 12.2389,
    name: 'Roma Fiumicino',
    meetingPoint: 'Terminal 1 — Uscita Arrivi B, marciapiede raccolta NCC (corsia destra).',
    nccWaitingArea: 'Parcheggio Breve Sosta T1 (zona NCC autorizzati)',
    driverEtaMin: 8,
  },
  CIA: {
    lat: 41.7994, lng: 12.5949,
    name: 'Roma Ciampino',
    meetingPoint: 'Uscita Arrivi — Parcheggio Accosto P3 (Piazzale Leonardo da Vinci, lato parcheggio passeggeri).',
    nccWaitingArea: 'Parcheggio Polmone NCC — Viale R. Ferrario (ticket parcometro obbligatorio)',
    driverEtaMin: 5,
  },
  MXP: {
    lat: 45.6301, lng: 8.7233,
    name: 'Milano Malpensa',
    meetingPoint: 'Terminal 1 — Arrivi, uscita D, zona raccolta autisti privati (piano 0).',
    nccWaitingArea: 'P0 Terminal 1 — area NCC (parcheggio autorizzato)',
    driverEtaMin: 6,
  },
  BGY: {
    lat: 45.6714, lng: 9.7042,
    name: 'Milano Bergamo Orio',
    meetingPoint: 'Uscita Arrivi — area NCC esterna (oltre le colonnine, lato bus).',
    nccWaitingArea: 'Area raccolta NCC (segnaletica blu, fronte terminal)',
    driverEtaMin: 4,
  },
  NAP: {
    lat: 40.8860, lng: 14.2908,
    name: 'Napoli Capodichino',
    meetingPoint: 'Uscita Arrivi — zona esterna, lato destro verso parcheggio (area NCC).',
    nccWaitingArea: 'Piazzale sosta NCC (accesso da Via Fulco Ruffo di Calabria)',
    driverEtaMin: 5,
  },
  BRI: {
    lat: 41.1389, lng: 16.7606,
    name: 'Bari Karol Wojtyla',
    meetingPoint: 'Uscita Arrivi — corsello esterno, parcheggio P1 (zona raccolta NCC).',
    nccWaitingArea: 'P1 — piani superiori (sosta NCC)',
    driverEtaMin: 5,
  },
  LGW: {
    lat: 51.1537, lng: -0.1821,
    name: 'London Gatwick',
    meetingPoint: 'South Terminal — Arrivals forecourt, PHV pickup zone (follow blue signs).',
    nccWaitingArea: 'PHV holding area (Gatwick approved)',
    driverEtaMin: 8,
  },
  LHR: {
    lat: 51.4700, lng: -0.4543,
    name: 'London Heathrow',
    meetingPoint: 'Terminal Arrivals — vehicle forecourt, Flanvo pickup bay.',
    nccWaitingArea: 'PHV/Meet & Greet holding area',
    driverEtaMin: 10,
  },
  BCN: {
    lat: 41.2974, lng: 2.0833,
    name: 'Barcellona El Prat',
    meetingPoint: 'Terminal 1 — Llegadas, zona VTC exterior (junto a la pasarela peatonal).',
    nccWaitingArea: 'Zona espera VTC T1',
    driverEtaMin: 6,
  },
  CDG: {
    lat: 49.0097, lng: 2.5479,
    name: 'Parigi Charles de Gaulle',
    meetingPoint: 'Terminal 2E — Zone de dépose VTC (niveau arrivées, sortie L).',
    nccWaitingArea: 'Zone d\'attente VTC/chauffeur (accès CDG autorisé)',
    driverEtaMin: 8,
  },
  AMS: {
    lat: 52.3086, lng: 4.7639,
    name: 'Amsterdam Schiphol',
    meetingPoint: 'Arrivals Hall — Taxi & transfer forecourt, look for Flanvo on the app.',
    nccWaitingArea: 'P1 Short Stay (private hire approved zone)',
    driverEtaMin: 7,
  },
  FRA: {
    lat: 50.0379, lng: 8.5622,
    name: 'Francoforte',
    meetingPoint: 'Terminal 1 — Ankunft B, Mietwagen-Abholzone (Ebene 0).',
    nccWaitingArea: 'Parkhaus Terminal 1 — Mietwagen/Chauffeur',
    driverEtaMin: 8,
  },
  MAD: {
    lat: 40.4719, lng: -3.5626,
    name: 'Madrid Barajas',
    meetingPoint: 'Terminal 4 — Llegadas, Zona VTC exterior (salida T4S, nivel 0).',
    nccWaitingArea: 'Área espera VTC T4',
    driverEtaMin: 7,
  },
};
