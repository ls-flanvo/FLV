import { Resend } from 'resend';

const FROM = 'Flanvo <noreply@flanvo.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://flv-psi.vercel.app';

const logoWordmark = `
  <div style="margin-bottom:28px">
    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.04em;color:#ffffff">Flanvo</span>
  </div>
`;

const logoWordmarkLight = `
  <div style="margin-bottom:28px">
    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.04em;color:#0a0a0a">Flanvo</span>
  </div>
`;

const footerDark = `
  <hr style="border:none;border-top:1px solid #2a2a2a;margin:28px 0"/>
  <p style="color:#555;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
    Flanvo — Shared Airport Transfers<br/>
    <a href="${APP_URL}" style="color:#00D1B2;text-decoration:none">flanvo.com</a> ·
    <a href="mailto:hello@flanvo.com" style="color:#00D1B2;text-decoration:none">hello@flanvo.com</a>
  </p>
`;

const footerLight = `
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0"/>
  <p style="color:#888;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
    Flanvo — Shared Airport Transfers<br/>
    <a href="${APP_URL}" style="color:#00C2B5;text-decoration:none">flanvo.com</a> ·
    <a href="mailto:hello@flanvo.com" style="color:#00C2B5;text-decoration:none">hello@flanvo.com</a>
  </p>
`;

function wrapEmail(content: string, dark = false): string {
  const bg = dark ? '#0B0B0B' : '#ffffff';
  const logo = dark ? logoWordmark : logoWordmarkLight;
  const footer = dark ? footerDark : footerLight;
  return `
    <div style="background:${bg};padding:0;margin:0">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 32px">
        ${logo}
        ${content}
        ${footer}
      </div>
    </div>
  `;
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email mock] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Email send error:', err);
  }
}

export async function sendWelcome(to: string, name: string) {
  await send(
    to,
    'Benvenuto su Flanvo!',
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Benvenuto, ${name}!</h1>
      <p style="color:#444;line-height:1.6">Il tuo account è pronto. Prenota corse condivise dall'aeroporto e risparmia fino al <strong>78%</strong> rispetto a taxi e NCC privati.</p>
      <a href="${APP_URL}/flight-search"
         style="display:inline-block;background:#00D1B2;color:#0a0a0a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;font-size:15px">
        Cerca la tua prima corsa →
      </a>
      <p style="color:#888;font-size:13px">Inserisci il codice volo, la tua destinazione e il sistema ti troverà compagni di viaggio sullo stesso volo.</p>
    `)
  );
}

export async function sendBookingConfirmation(
  to: string,
  params: { flightNumber: string; pickupTime: string; estimatedPrice?: number | null }
) {
  await send(
    to,
    `Prenotazione confermata — Volo ${params.flightNumber}`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Prenotazione confermata!</h1>
      <p style="color:#444;line-height:1.6">La tua corsa per il volo <strong>${params.flightNumber}</strong> è stata prenotata con successo. Ti avviseremo quando il gruppo sarà pronto.</p>
      <div style="background:#f5f5f5;border-radius:10px;padding:20px;margin:20px 0">
        <p style="margin:6px 0;color:#333"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:6px 0;color:#333"><strong>Pickup stimato:</strong> ${new Date(params.pickupTime).toLocaleString('it-IT')}</p>
        ${params.estimatedPrice ? `<p style="margin:6px 0;color:#333"><strong>Prezzo stimato:</strong> €${params.estimatedPrice.toFixed(2)}</p>` : ''}
      </div>
      <p style="color:#666;font-size:13px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px">
        ✓ Nessun addebito ora — pagherai quando il driver accetta la corsa.
      </p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#00D1B2;color:#0a0a0a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;font-size:15px">
        Vai alla Dashboard →
      </a>
    `)
  );
}

export async function sendCancellationConfirmed(
  to: string,
  params: { flightNumber: string; refundType: 'full' | 'fee' | 'paid-no-refund' | false }
) {
  const refundNote =
    params.refundType === 'full'
      ? `<p style="color:#16a34a;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px">
          ✓ Rimborso integrale in elaborazione — sia la quota Flanvo che il compenso driver sono stati rimborsati. I fondi saranno disponibili entro 5–7 giorni lavorativi.
         </p>`
      : params.refundType === 'fee'
      ? `<p style="color:#16a34a;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px">
          ✓ Rimborso parziale in elaborazione — la quota servizio Flanvo è stata rimborsata. Il compenso del driver per la presenza rimane confermato (Policy §4b). I fondi Flanvo saranno disponibili entro 5–7 giorni lavorativi.
         </p>`
      : params.refundType === 'paid-no-refund'
      ? `<p style="color:#92400e;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px">
          Il pagamento effettuato non verrà rimborsato automaticamente (Policy §4). Se hai una forza maggiore documentata (emergenza medica, bagagli smarriti), apri una disputa entro 24 ore scrivendo a <a href="mailto:hello@flanvo.com" style="color:#b45309">hello@flanvo.com</a>.
         </p>`
      : `<p style="color:#6b7280;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
          Nessun addebito effettuato — la prenotazione è stata cancellata senza costi.
         </p>`;
  await send(
    to,
    `Prenotazione cancellata — Volo ${params.flightNumber}`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Prenotazione cancellata</h1>
      <p style="color:#444;line-height:1.6">La tua prenotazione per il volo <strong>${params.flightNumber}</strong> è stata cancellata.</p>
      ${refundNote}
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#00D1B2;color:#0a0a0a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;font-size:15px">
        Torna alla Dashboard →
      </a>
    `)
  );
}

export async function sendGroupConfirmed(
  to: string,
  params: { flightNumber: string; pickupTime: string; groupSize: number; finalPrice?: number | null; driverName?: string }
) {
  await send(
    to,
    `Gruppo confermato — Volo ${params.flightNumber}`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Gruppo di viaggio confermato!</h1>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin:20px 0">
        <p style="margin:6px 0;color:#333"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:6px 0;color:#333"><strong>Pickup:</strong> ${new Date(params.pickupTime).toLocaleString('it-IT')}</p>
        <p style="margin:6px 0;color:#333"><strong>Passeggeri nel gruppo:</strong> ${params.groupSize}</p>
        ${params.driverName ? `<p style="margin:6px 0;color:#333"><strong>Autista:</strong> ${params.driverName}</p>` : ''}
        ${params.finalPrice ? `<p style="margin:10px 0 0;font-size:20px;font-weight:700;color:#00C2B5">Il tuo prezzo: €${params.finalPrice.toFixed(2)}</p>` : ''}
      </div>
      <p style="color:#666;font-size:13px">Il pagamento è stato confermato al momento dell'accettazione del driver.</p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#00D1B2;color:#0a0a0a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;font-size:15px">
        Segui la tua corsa →
      </a>
    `)
  );
}

export async function sendGroupReady(to: string, data: {
  userName: string; flightNumber: string; groupSize: number;
  pricePerPerson: number; groupMemberId: string; appUrl: string;
}) {
  await send(
    to,
    `Gruppo trovato per il volo ${data.flightNumber}! Conferma entro 24h — Flanvo`,
    wrapEmail(`
      <h2 style="color:#00D1B2;font-size:22px;margin:0 0 16px">Gruppo trovato!</h2>
      <p style="color:#A1A1AA;margin:0 0 8px">Ciao ${data.userName},</p>
      <p style="color:#A1A1AA">Abbiamo trovato <strong style="color:#fff">${data.groupSize} passeggeri</strong> compatibili per il volo <strong style="color:#fff">${data.flightNumber}</strong>.</p>
      <div style="background:#141414;border:1px solid #2A2A2A;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
        <p style="color:#A1A1AA;margin:0 0 4px;font-size:13px">Il tuo prezzo finale</p>
        <p style="font-size:42px;font-weight:900;color:#00D1B2;margin:0;letter-spacing:-0.02em">€${data.pricePerPerson.toFixed(2)}</p>
        <p style="color:#555;font-size:12px;margin:6px 0 0">Pagamento all'accettazione del driver</p>
      </div>
      <p style="color:#A1A1AA">Hai <strong style="color:#fff">24 ore</strong> per confermare il tuo posto.</p>
      <a href="${data.appUrl}/checkout/${data.groupMemberId}" style="display:block;margin:20px 0;padding:16px 32px;background:#00D1B2;color:#0B0B0B;font-weight:700;border-radius:12px;text-decoration:none;font-size:16px;text-align:center">
        Conferma e paga →
      </a>
    `, true)
  );
}

export async function sendDriverApproved(to: string, driverName: string) {
  await send(
    to,
    'Account autista approvato — Flanvo',
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Benvenuto, ${driverName}!</h1>
      <p style="color:#444;line-height:1.6">La tua candidatura è stata <strong style="color:#16a34a">approvata</strong>. Puoi ora accedere alla dashboard autista e accettare corse.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin:20px 0">
        <p style="margin:6px 0;color:#333;font-size:14px">✓ Configura Stripe Connect per ricevere i pagamenti</p>
        <p style="margin:6px 0;color:#333;font-size:14px">✓ Attiva le notifiche push per le nuove corse</p>
        <p style="margin:6px 0;color:#333;font-size:14px">✓ Accetta le corse disponibili dal tuo aeroporto</p>
      </div>
      <a href="${APP_URL}/driver/login"
         style="display:inline-block;background:#00D1B2;color:#0a0a0a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;font-size:15px">
        Accedi come Autista →
      </a>
    `)
  );
}

export async function sendDriverRejected(to: string, driverName: string, reason?: string) {
  await send(
    to,
    'Aggiornamento candidatura — Flanvo',
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Ciao ${driverName},</h1>
      <p style="color:#444;line-height:1.6">Purtroppo la tua candidatura non è stata accettata in questo momento.</p>
      ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:16px 0"><p style="margin:0;color:#7f1d1d"><strong>Motivo:</strong> ${reason}</p></div>` : ''}
      <p style="color:#666;font-size:14px">Puoi ripresentare la candidatura in futuro o contattarci per chiarimenti.</p>
      <a href="mailto:hello@flanvo.com"
         style="display:inline-block;background:#f5f5f5;color:#0a0a0a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;font-size:14px">
        Contatta il supporto
      </a>
    `)
  );
}

export async function sendRideReceipt(
  to: string,
  params: {
    userName: string;
    flightNumber: string;
    pickupTime: string;
    dropoffAddress: string;
    driverName: string;
    vehicleModel: string;
    vehiclePlate: string;
    driverShare: number;
    flanvoFee: number;
    totalPrice: number;
    receiptId: string;
  }
) {
  const date = new Date(params.pickupTime).toLocaleString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  await send(
    to,
    `Ricevuta corsa — Volo ${params.flightNumber}`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Ricevuta di pagamento</h1>
      <p style="color:#444;line-height:1.6">Ciao ${params.userName}, la tua corsa è stata completata.</p>
      <div style="background:#f5f5f5;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:12px;color:#666">Ricevuta n°</p>
        <p style="margin:4px 0;font-weight:700;color:#0a0a0a">${params.receiptId}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Data</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#0a0a0a">${date}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Volo</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#0a0a0a">${params.flightNumber}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Destinazione</td><td style="padding:10px 0;text-align:right;color:#0a0a0a">${params.dropoffAddress}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Autista</td><td style="padding:10px 0;text-align:right;color:#0a0a0a">${params.driverName} · ${params.vehiclePlate}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Quota trasporto</td><td style="padding:10px 0;text-align:right;color:#0a0a0a">€${params.driverShare.toFixed(2)}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Servizio Flanvo</td><td style="padding:10px 0;text-align:right;color:#0a0a0a">€${params.flanvoFee.toFixed(2)}</td></tr>
        <tr><td style="padding:14px 0;font-weight:700;font-size:16px;color:#0a0a0a">Totale addebitato</td><td style="padding:14px 0;text-align:right;font-weight:700;font-size:20px;color:#00C2B5">€${params.totalPrice.toFixed(2)}</td></tr>
      </table>
      <p style="color:#888;font-size:13px">Questa ricevuta è valida come documento di spesa.</p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#00D1B2;color:#0a0a0a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;font-size:15px">
        Vai alla Dashboard →
      </a>
    `)
  );
}

export async function sendCancellationPenalty(
  to: string,
  params: { userName: string; flightNumber: string; amount: number; receiptId: string }
) {
  await send(
    to,
    `Addebito cancellazione — Volo ${params.flightNumber}`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Conferma cancellazione</h1>
      <p style="color:#444;line-height:1.6">Ciao ${params.userName}, la prenotazione per il volo <strong>${params.flightNumber}</strong> è stata cancellata.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:700;color:#dc2626">No-show dopo accettazione driver — nessun rimborso</p>
        <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.5">Il driver aveva già accettato la corsa. L'importo di <strong>€${params.amount.toFixed(2)}</strong> è stato addebitato sulla tua carta a copertura del servizio.</p>
        <p style="margin:8px 0 0;font-size:12px;color:#991b1b">Ricevuta n° ${params.receiptId}</p>
      </div>
      <p style="color:#666;font-size:13px">Hai avuto un imprevisto al pickup? Apri una disputa entro 24h su <a href="mailto:hello@flanvo.com" style="color:#00C2B5">hello@flanvo.com</a>.</p>
    `)
  );
}

export async function sendAirlineCancellationAssistance(
  to: string,
  params: {
    userName: string;
    flightNumber: string;
    reason: 'cancelled' | 'diverted';
    bookingId: string;
    amount: number;
    pickupDate: string;
  }
) {
  const reasonLabel = params.reason === 'cancelled' ? 'cancellato' : 'dirottato';
  const reasonTitle = params.reason === 'cancelled' ? 'Volo cancellato' : 'Volo dirottato';
  await send(
    to,
    `${reasonTitle} — Come richiedere il rimborso alla compagnia aerea`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">${reasonTitle}: ecco come ottenere il rimborso</h1>
      <p style="color:#444;line-height:1.6">Ciao ${params.userName}, il volo <strong>${params.flightNumber}</strong> è stato ${reasonLabel} dalla compagnia aerea.</p>

      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:700;color:#92400e">Flanvo non prevede rimborso diretto per questo caso</p>
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.5">La responsabilità è della compagnia aerea. In base al <strong>Regolamento UE 261/2004</strong>, hai diritto al rimborso delle spese di trasporto alternativo — inclusa la tua prenotazione Flanvo.</p>
      </div>

      <h2 style="color:#0a0a0a;font-size:18px;font-weight:700;margin:24px 0 12px">La tua ricevuta Flanvo</h2>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 20px">
        <p style="margin:0 0 6px;font-size:13px;color:#374151"><strong>Prenotazione:</strong> ${params.bookingId}</p>
        <p style="margin:0 0 6px;font-size:13px;color:#374151"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:0 0 6px;font-size:13px;color:#374151"><strong>Data:</strong> ${params.pickupDate}</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0a0a0a"><strong>Importo:</strong> €${params.amount.toFixed(2)}</p>
      </div>

      <h2 style="color:#0a0a0a;font-size:18px;font-weight:700;margin:24px 0 12px">Come richiedere il rimborso — 3 passi</h2>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin:0 0 20px">
        <p style="margin:0 0 12px;font-size:14px;color:#166534"><strong>1.</strong> Contatta la compagnia aerea tramite il loro portale reclami o per email.</p>
        <p style="margin:0 0 12px;font-size:14px;color:#166534"><strong>2.</strong> Richiedi il rimborso delle spese di trasporto ai sensi del Reg. UE 261/2004, Art. 8.</p>
        <p style="margin:0;font-size:14px;color:#166534"><strong>3.</strong> Allega questa email come ricevuta della spesa di trasporto (€${params.amount.toFixed(2)}).</p>
      </div>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 20px">
        <p style="margin:0 0 8px;font-weight:700;font-size:13px;color:#374151">Template da copiare e inviare alla compagnia aerea:</p>
        <p style="margin:0;font-size:12px;color:#6b7280;font-style:italic;line-height:1.6">
          "In riferimento al volo ${params.flightNumber} del ${params.pickupDate}, ${reasonLabel} dalla vostra compagnia, richiedo il rimborso delle spese di trasporto alternativo sostenute ai sensi del Regolamento UE 261/2004. Allego ricevuta del servizio Flanvo per €${params.amount.toFixed(2)} (prenotazione ${params.bookingId})."
        </p>
      </div>

      <p style="color:#666;font-size:13px">Hai bisogno di supporto nella procedura? Il team Flanvo ti affianca — scrivi a <a href="mailto:hello@flanvo.com" style="color:#00C2B5">hello@flanvo.com</a> indicando la prenotazione <strong>${params.bookingId}</strong>.</p>
    `)
  );
}

export async function sendPickupReminder(
  to: string,
  params: {
    userName: string;
    flightNumber: string;
    pickupTime: string;
    driverName: string;
    dropoffAddress: string;
  }
) {
  await send(
    to,
    `Pickup tra 30 minuti — Volo ${params.flightNumber}`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px">Il tuo van arriva tra 30 minuti!</h1>
      <p style="color:#444;line-height:1.6">Ciao ${params.userName}, preparati — il pickup è alle <strong>${params.pickupTime}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin:20px 0">
        <p style="margin:6px 0;color:#333"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:6px 0;color:#333"><strong>Pickup:</strong> ${params.pickupTime}</p>
        <p style="margin:6px 0;color:#333"><strong>Autista:</strong> ${params.driverName}</p>
        <p style="margin:6px 0;color:#333"><strong>Destinazione:</strong> ${params.dropoffAddress}</p>
      </div>
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px;margin:16px 0;font-size:14px;color:#713f12">
        Dirigiti verso l'uscita Arrivi del terminal. Cerca il nome "Flanvo" sul display del driver.
      </div>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#00D1B2;color:#0a0a0a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;font-size:15px">
        Apri Tracking Live →
      </a>
    `)
  );
}

export async function sendAdminNoCoverAlert(params: {
  flightNumber: string;
  departureTime: Date;
  passengerCount: number;
  totalRefunded: number;
  rideGroupId: string;
}) {
  const adminEmail = process.env.ADMIN_OPS_EMAIL || 'hello@flanvo.com';
  const dep = params.departureTime.toLocaleString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  await send(
    adminEmail,
    `⚠️ Nessun driver — Corsa annullata automaticamente (${params.flightNumber})`,
    wrapEmail(`
      <h1 style="color:#0a0a0a;font-size:22px;font-weight:700;margin:0 0 8px">Corsa annullata — nessun driver trovato</h1>
      <p style="color:#444;line-height:1.6">Il sistema ha cancellato automaticamente una corsa perché nessun driver ha accettato entro D-2h dalla partenza.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin:20px 0">
        <p style="margin:6px 0;color:#333"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:6px 0;color:#333"><strong>Partenza:</strong> ${dep}</p>
        <p style="margin:6px 0;color:#333"><strong>Passeggeri coinvolti:</strong> ${params.passengerCount}</p>
        <p style="margin:6px 0;color:#333"><strong>Importo rimborsato:</strong> €${params.totalRefunded.toFixed(2)}</p>
        <p style="margin:6px 0;font-size:12px;color:#666">Group ID: ${params.rideGroupId}</p>
      </div>
      <p style="color:#dc2626;font-weight:600">I passeggeri sono stati notificati e hanno 2 ore per organizzarsi prima del decollo.</p>
      <a href="${APP_URL}/admin/rides/monitor"
         style="display:inline-block;background:#0a0a0a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;font-size:14px">
        Apri Monitor Corse →
      </a>
    `)
  );
}

export async function sendNewRideAvailable(
  to: string,
  params: { driverName: string; flightNumber: string; pax: number; airportName: string }
) {
  await send(
    to,
    `Nuova corsa disponibile — Volo ${params.flightNumber}`,
    wrapEmail(`
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px">Ciao ${params.driverName}, nuova corsa disponibile!</h1>
      <p style="color:#A1A1AA;margin:0 0 20px">Accetta prima che un altro driver la prenda.</p>
      <div style="background:#141414;border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin:20px 0">
        <p style="margin:6px 0;color:#A1A1AA"><strong style="color:#fff">Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:6px 0;color:#A1A1AA"><strong style="color:#fff">Aeroporto:</strong> ${params.airportName}</p>
        <p style="margin:6px 0;color:#A1A1AA"><strong style="color:#fff">Passeggeri:</strong> ${params.pax}</p>
      </div>
      <a href="${APP_URL}/driver/dashboard"
         style="display:block;background:#00D1B2;color:#0B0B0B;padding:16px 24px;border-radius:8px;text-decoration:none;font-weight:700;text-align:center;margin:20px 0;font-size:15px">
        Vai alla Dashboard Driver →
      </a>
    `, true)
  );
}
