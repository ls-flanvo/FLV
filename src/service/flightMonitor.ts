// src/services/flightMonitor.ts

export interface FlightStatusUpdate {
  flightId: string;
  previousStatus: string;
  newStatus: 'cancelled' | 'diverted' | 'delayed';
  divertedTo?: string;
  timestamp: string;
  affectedBookings: string[];
}

/**
 * Servizio per monitorare cambiamenti di stato dei voli
 * In produzione, questo dovrebbe essere integrato con API di flight tracking
 * come FlightAware, AviationStack, o simili
 */
export class FlightMonitorService {
  
  /**
   * Controlla lo stato di un volo specifico
   * @param flightCode - Codice volo (es. AZ1234)
   * @returns Status aggiornato del volo
   */
  static async checkFlightStatus(flightCode: string) {
    try {
      // TODO: Integrare con API flight tracking reale
      // Esempio: FlightAware, AviationStack, ecc.
      
      const response = await fetch(`/api/flights/${flightCode}/status`);
      const data = await response.json();
      
      return {
        code: flightCode,
        status: data.status,
        divertedTo: data.divertedTo,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error checking flight status:', error);
      return null;
    }
  }

  /**
   * Monitora tutti i voli attivi e notifica cambiamenti
   */
  static async monitorActiveFlights() {
    try {
      // Recupera tutti i voli con prenotazioni attive
      const response = await fetch('/api/flights/active');
      const activeFlights = await response.json();

      const updates: FlightStatusUpdate[] = [];

      for (const flight of activeFlights) {
        const currentStatus = await this.checkFlightStatus(flight.code);
        
        if (currentStatus && this.hasStatusChanged(flight, currentStatus)) {
          updates.push({
            flightId: flight.id,
            previousStatus: flight.status,
            newStatus: currentStatus.status,
            divertedTo: currentStatus.divertedTo,
            timestamp: new Date().toISOString(),
            affectedBookings: flight.bookings || []
          });
        }
      }

      // Processa gli aggiornamenti
      if (updates.length > 0) {
        await this.processStatusUpdates(updates);
      }

      return updates;

    } catch (error) {
      console.error('Error monitoring flights:', error);
      return [];
    }
  }

  /**
   * Verifica se lo status è cambiato in modo significativo
   */
  private static hasStatusChanged(oldFlight: any, newStatus: any): boolean {
    return (
      oldFlight.status !== newStatus.status &&
      ['cancelled', 'diverted'].includes(newStatus.status)
    );
  }

  /**
   * Processa gli aggiornamenti di stato e notifica gli utenti
   */
  private static async processStatusUpdates(updates: FlightStatusUpdate[]) {
    for (const update of updates) {
      
      // 1. Aggiorna stato del volo nel database
      await fetch(`/api/flights/${update.flightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: update.newStatus,
          divertedTo: update.divertedTo
        })
      });

      // 2. Aggiorna tutte le prenotazioni collegate
      await this.updateAffectedBookings(update);

      // 3. Invia notifiche ai passeggeri
      await this.notifyPassengers(update);

      // 4. Notifica i driver
      await this.notifyDrivers(update);

      // 5. Log per admin
      console.log('Flight status updated:', update);
    }
  }

  /**
   * Aggiorna le prenotazioni interessate
   */
  private static async updateAffectedBookings(update: FlightStatusUpdate) {
    try {
      await fetch('/api/bookings/update-by-flight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: update.flightId,
          newStatus: update.newStatus,
          eligibleForRefund: true
        })
      });
    } catch (error) {
      console.error('Error updating bookings:', error);
    }
  }

  /**
   * Notifica i passeggeri via email/SMS/push
   */
  private static async notifyPassengers(update: FlightStatusUpdate) {
    try {
      const message = this.generatePassengerNotification(update);
      
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds: update.affectedBookings,
          type: update.newStatus,
          message,
          channels: ['email', 'push'] // SMS opzionale
        })
      });
    } catch (error) {
      console.error('Error notifying passengers:', error);
    }
  }

  /**
   * Notifica i driver
   */
  private static async notifyDrivers(update: FlightStatusUpdate) {
    try {
      await fetch('/api/notifications/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: update.flightId,
          status: update.newStatus,
          message: `Attenzione: volo ${update.flightId} ${update.newStatus}`
        })
      });
    } catch (error) {
      console.error('Error notifying drivers:', error);
    }
  }

  /**
   * Genera il messaggio di notifica per i passeggeri
   */
  private static generatePassengerNotification(update: FlightStatusUpdate): string {
    if (update.newStatus === 'cancelled') {
      return `Il tuo volo è stato cancellato dalla compagnia aerea. Hai diritto al rimborso completo della prenotazione Flanvo. Accedi alla tua dashboard per gestire la cancellazione.`;
    }
    
    if (update.newStatus === 'diverted' && update.divertedTo) {
      return `Il tuo volo è stato dirottato a ${update.divertedTo}. Puoi cercare un nuovo trasferimento o cancellare con rimborso completo. Accedi alla dashboard per le opzioni.`;
    }

    return `Aggiornamento importante sul tuo volo. Controlla la tua prenotazione per maggiori dettagli.`;
  }
}

/**
 * Worker per monitoraggio continuo
 * Da eseguire come cron job o background task
 */
export async function startFlightMonitoring() {
  console.log('Flight monitoring service started');
  
  // Controlla ogni 5 minuti
  setInterval(async () => {
    try {
      const updates = await FlightMonitorService.monitorActiveFlights();
      
      if (updates.length > 0) {
        console.log(`Processed ${updates.length} flight status updates`);
      }
    } catch (error) {
      console.error('Flight monitoring error:', error);
    }
  }, 5 * 60 * 1000); // 5 minuti
}