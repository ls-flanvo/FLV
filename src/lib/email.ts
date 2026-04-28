import { Resend } from 'resend';

// Usa onboarding@resend.dev finché il dominio non è verificato su Resend
// Dopo aver verificato flanvo.com su resend.com, cambia in: 'Flanvo <hello@flanvo.com>'
const FROM = 'Flanvo <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://flv-psi.vercel.app';

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

const footer = `
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">
    Flanvo — Shared Airport Transfers<br/>
    <a href="${APP_URL}" style="color:#00C2B5">flv-psi.vercel.app</a> ·
    <a href="mailto:hello@flanvo.com" style="color:#00C2B5">hello@flanvo.com</a>
  </p>
`;

export async function sendWelcome(to: string, name: string) {
  await send(
    to,
    'Benvenuto su Flanvo!',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Benvenuto, ${name}!</h1>
      <p>Il tuo account Flanvo è pronto. Ora puoi prenotare corse condivise dall'aeroporto e risparmiare fino al 78% rispetto a taxi e NCC privati.</p>
      <a href="${APP_URL}/flight-search"
         style="display:inline-block;background:#00C2B5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Cerca la tua prima corsa
      </a>
      <p style="color:#666">Inserisci il codice volo, la tua destinazione e il sistema ti troverà compagni di viaggio sullo stesso volo.</p>
      ${footer}
    </div>`
  );
}

export async function sendBookingConfirmation(
  to: string,
  params: { flightNumber: string; pickupTime: string; estimatedPrice?: number | null }
) {
  await send(
    to,
    `Prenotazione confermata — Volo ${params.flightNumber}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Prenotazione confermata!</h1>
      <p>La tua corsa per il volo <strong>${params.flightNumber}</strong> è stata prenotata con successo.</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:4px 0"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:4px 0"><strong>Pickup:</strong> ${new Date(params.pickupTime).toLocaleString('it-IT')}</p>
        ${params.estimatedPrice ? `<p style="margin:4px 0"><strong>Prezzo stimato:</strong> €${params.estimatedPrice.toFixed(2)}</p>` : ''}
      </div>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#00C2B5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
        Vai alla dashboard
      </a>
      ${footer}
    </div>`
  );
}

export async function sendCancellationConfirmed(
  to: string,
  params: { flightNumber: string; refunded: boolean }
) {
  await send(
    to,
    'Prenotazione cancellata — Flanvo',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Prenotazione cancellata</h1>
      <p>La tua prenotazione per il volo <strong>${params.flightNumber}</strong> è stata cancellata.</p>
      ${params.refunded
        ? '<p style="color:#16a34a">Il rimborso della pre-autorizzazione sarà elaborato automaticamente entro 5-7 giorni lavorativi.</p>'
        : '<p style="color:#dc2626">Cancellazione post-match: nessun rimborso previsto secondo la policy Flanvo.</p>'
      }
      ${footer}
    </div>`
  );
}

export async function sendGroupConfirmed(
  to: string,
  params: { flightNumber: string; pickupTime: string; groupSize: number; finalPrice?: number | null; driverName?: string }
) {
  await send(
    to,
    `Gruppo confermato — Volo ${params.flightNumber}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Gruppo di viaggio confermato!</h1>
      <div style="background:#f0fdf4;border:1px solid #86efac;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:4px 0"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:4px 0"><strong>Pickup:</strong> ${new Date(params.pickupTime).toLocaleString('it-IT')}</p>
        <p style="margin:4px 0"><strong>Passeggeri:</strong> ${params.groupSize}</p>
        ${params.driverName ? `<p style="margin:4px 0"><strong>Autista:</strong> ${params.driverName}</p>` : ''}
        ${params.finalPrice ? `<p style="margin:4px 0;font-size:18px"><strong>Il tuo prezzo: €${params.finalPrice.toFixed(2)}</strong></p>` : ''}
      </div>
      <p>Il pagamento verrà addebitato solo al momento del drop-off.</p>
      ${footer}
    </div>`
  );
}

export async function sendDriverApproved(to: string, driverName: string) {
  await send(
    to,
    'Account autista approvato — Flanvo',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Benvenuto, ${driverName}!</h1>
      <p>La tua candidatura è stata <strong style="color:#16a34a">approvata</strong>.</p>
      <p>Ora puoi accedere alla dashboard autista, accettare corse e configurare i pagamenti tramite Stripe.</p>
      <a href="${APP_URL}/driver/login"
         style="display:inline-block;background:#00C2B5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Accedi come autista
      </a>
      ${footer}
    </div>`
  );
}

export async function sendDriverRejected(to: string, driverName: string, reason?: string) {
  await send(
    to,
    'Aggiornamento candidatura — Flanvo',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Ciao ${driverName},</h1>
      <p>Purtroppo la tua candidatura non è stata accettata in questo momento.</p>
      ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
      <p>Puoi ripresentare la candidatura in futuro. Per domande scrivi a <a href="mailto:hello@flanvo.com">hello@flanvo.com</a>.</p>
      ${footer}
    </div>`
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
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Ricevuta di pagamento</h1>
      <p>Ciao ${params.userName}, la tua corsa è stata completata.</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:4px 0;font-size:12px;color:#666">Ricevuta n°</p>
        <p style="margin:4px 0;font-weight:bold">${params.receiptId}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Data</td><td style="padding:10px 0;text-align:right;font-weight:bold">${date}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Volo</td><td style="padding:10px 0;text-align:right;font-weight:bold">${params.flightNumber}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Destinazione</td><td style="padding:10px 0;text-align:right">${params.dropoffAddress}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Autista</td><td style="padding:10px 0;text-align:right">${params.driverName} · ${params.vehiclePlate}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Quota trasporto</td><td style="padding:10px 0;text-align:right">€${params.driverShare.toFixed(2)}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="padding:10px 0;color:#666">Servizio Flanvo</td><td style="padding:10px 0;text-align:right">€${params.flanvoFee.toFixed(2)}</td></tr>
        <tr><td style="padding:12px 0;font-weight:bold;font-size:16px">Totale addebitato</td><td style="padding:12px 0;text-align:right;font-weight:bold;font-size:18px;color:#00C2B5">€${params.totalPrice.toFixed(2)}</td></tr>
      </table>
      <p style="color:#666;font-size:13px">Questa ricevuta è valida come documento di spesa.</p>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#00C2B5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Vai alla Dashboard</a>
      ${footer}
    </div>`
  );
}

export async function sendCancellationPenalty(
  to: string,
  params: { userName: string; flightNumber: string; amount: number; receiptId: string }
) {
  await send(
    to,
    `Addebito cancellazione — Volo ${params.flightNumber}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Conferma cancellazione</h1>
      <p>Ciao ${params.userName}, la prenotazione per il volo <strong>${params.flightNumber}</strong> è stata cancellata.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:4px 0;font-weight:bold;color:#dc2626">Cancellazione post-match — nessun rimborso</p>
        <p style="margin:8px 0;color:#7f1d1d;font-size:14px">Secondo la Policy Flanvo §5.1, l'importo di <strong>€${params.amount.toFixed(2)}</strong> è stato addebitato sulla tua carta.</p>
        <p style="margin:4px 0;font-size:12px;color:#991b1b">Ricevuta n° ${params.receiptId}</p>
      </div>
      <p style="color:#666;font-size:13px">Per contestazioni scrivi a <a href="mailto:hello@flanvo.com" style="color:#00C2B5">hello@flanvo.com</a> entro 14 giorni.</p>
      ${footer}
    </div>`
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
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#0a0a0a">Il tuo van arriva tra 30 minuti!</h1>
      <p>Ciao ${params.userName}, preparati — il pickup è alle <strong>${params.pickupTime}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:4px 0"><strong>Volo:</strong> ${params.flightNumber}</p>
        <p style="margin:4px 0"><strong>Pickup:</strong> ${params.pickupTime}</p>
        <p style="margin:4px 0"><strong>Autista:</strong> ${params.driverName}</p>
        <p style="margin:4px 0"><strong>Destinazione:</strong> ${params.dropoffAddress}</p>
      </div>
      <p style="background:#fef9c3;border:1px solid #fde047;padding:12px;border-radius:8px;font-size:14px">
        📍 Dirigiti verso l'uscita Arrivi del terminal. Cerca il cartello con il logo Flanvo.
      </p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#00C2B5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Apri Tracking Live
      </a>
      ${footer}
    </div>`
  );
}
