import { Resend } from 'resend';

const FROM = 'Flanvo <noreply@flanvo.app>';

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

export async function sendBookingConfirmation(
  to: string,
  params: { flightNumber: string; pickupTime: string; estimatedPrice?: number | null }
) {
  await send(
    to,
    `Prenotazione confermata - Volo ${params.flightNumber}`,
    `<h2>Prenotazione confermata!</h2>
    <p>La tua corsa per il volo <strong>${params.flightNumber}</strong> è stata prenotata.</p>
    <p><strong>Pickup:</strong> ${new Date(params.pickupTime).toLocaleString('it-IT')}</p>
    ${params.estimatedPrice ? `<p><strong>Prezzo stimato:</strong> €${params.estimatedPrice.toFixed(2)}</p>` : ''}
    <p>Accedi alla tua dashboard per i dettagli.</p>
    <p>Il team Flanvo</p>`
  );
}

export async function sendCancellationConfirmed(
  to: string,
  params: { flightNumber: string; refunded: boolean }
) {
  await send(
    to,
    'Prenotazione cancellata',
    `<h2>Prenotazione cancellata</h2>
    <p>La tua prenotazione per il volo <strong>${params.flightNumber}</strong> è stata cancellata.</p>
    ${params.refunded ? '<p>Il rimborso sarà elaborato entro 5-7 giorni lavorativi.</p>' : ''}
    <p>Il team Flanvo</p>`
  );
}

export async function sendGroupConfirmed(
  to: string,
  params: { flightNumber: string; pickupTime: string; groupSize: number; finalPrice?: number | null; driverName?: string }
) {
  await send(
    to,
    `Gruppo confermato - Volo ${params.flightNumber}`,
    `<h2>Gruppo di viaggio confermato!</h2>
    <p>Il tuo gruppo per il volo <strong>${params.flightNumber}</strong> è stato confermato.</p>
    <p><strong>Pickup:</strong> ${new Date(params.pickupTime).toLocaleString('it-IT')}</p>
    <p><strong>Passeggeri nel gruppo:</strong> ${params.groupSize}</p>
    ${params.driverName ? `<p><strong>Autista:</strong> ${params.driverName}</p>` : ''}
    ${params.finalPrice ? `<p><strong>Il tuo prezzo:</strong> €${params.finalPrice.toFixed(2)}</p>` : ''}
    <p>Il team Flanvo</p>`
  );
}

export async function sendDriverApproved(to: string, driverName: string) {
  await send(
    to,
    'Il tuo account autista è stato approvato!',
    `<h2>Benvenuto in Flanvo, ${driverName}!</h2>
    <p>La tua candidatura è stata <strong>approvata</strong>. Ora puoi accedere alla tua dashboard autista e iniziare ad accettare corse.</p>
    <p>Accedi su <a href="${process.env.NEXT_PUBLIC_APP_URL}/driver/login">flanvo.app/driver/login</a></p>
    <p>Il team Flanvo</p>`
  );
}

export async function sendDriverRejected(to: string, driverName: string, reason?: string) {
  await send(
    to,
    'Aggiornamento candidatura Flanvo',
    `<h2>Ciao ${driverName},</h2>
    <p>Purtroppo la tua candidatura non è stata accettata.</p>
    ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
    <p>Puoi candidarti nuovamente in futuro. Per domande contattaci.</p>
    <p>Il team Flanvo</p>`
  );
}
