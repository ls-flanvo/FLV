import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { GroupMember } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

/**
 * Get tiered Flanvo rate based on km
 */
export function getFlanvoRate(km: number): number {
  if (km >= 100) return 0.20;
  if (km >= 51) return 0.25;
  return 0.30;
}

/**
 * Calculate refund amount based on cancellation timing
 * (Currently not used - we use match-lock timing instead)
 */
export function calculateRefundAmount(
  totalPrice: number,
  hoursUntilRide: number
): {
  refundAmount: number;
  percentage: number;
  penaltyToDriver: number;
} {
  if (hoursUntilRide > 24) {
    return {
      refundAmount: totalPrice,
      percentage: 100,
      penaltyToDriver: 0
    };
  }

  if (hoursUntilRide >= 12) {
    return {
      refundAmount: totalPrice * 0.5,
      percentage: 50,
      penaltyToDriver: 0
    };
  }

  // <6h: no refund, 30% penalty to driver
  const penalty = totalPrice * 0.30;
  return {
    refundAmount: 0,
    percentage: 0,
    penaltyToDriver: penalty
  };
}

/**
 * Create transfer to driver Stripe Connected Account
 */
export async function createDriverTransfer(
  amount: number,
  driverAccountId: string,
  metadata: Record<string, string>
): Promise<Stripe.Transfer> {
  return await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'eur',
    destination: driverAccountId,
    metadata
  });
}

/**
 * Generate receipt data structure
 */
export function generateReceipt(member: any, payment: any) {
  return {
    receiptNumber: `FLV-${Date.now()}`,
    date: new Date(),
    passengerName: member.booking.user.name,
    flightNumber: member.rideGroup.flightNumber,
    route: {
      from: member.booking.pickupLocation,
      to: member.booking.dropoffLocation,
      kmTraveled: member.kmOnboard
    },
    pricing: {
      driverShare: member.driverShare,
      flanvoFee: member.flanvoFee,
      protectionFee: 1.00,
      total: member.totalPrice
    },
    paymentMethod: payment.payment_method || 'card',
    status: 'PAID',
    paymentIntentId: payment.id
  };
}

/**
 * Verify wait time for no-show
 */
export function verifyWaitTime(
  pickupWindowEnd: Date,
  currentTime: Date = new Date(),
  waitTimeMinutes: number = 20
): boolean {
  const elapsed = currentTime.getTime() - pickupWindowEnd.getTime();
  const required = waitTimeMinutes * 60 * 1000;
  return elapsed >= required;
}

/**
 * Add driver share to penalty pool for price lock mechanism
 */
export async function addToPenaltyPool(
  groupId: string,
  amount: number
): Promise<void> {
  try {
    // Check if PenaltyPool exists in your schema
    // If not, you can use InsurancePool or create a new model
    
    // For now, we'll just log it
    console.log(`Adding €${amount} to penalty pool for group ${groupId}`);
    
    // TODO: Implement actual penalty pool tracking
    // await prisma.penaltyPool.upsert({
    //   where: { groupId },
    //   create: {
    //     groupId,
    //     accumulated: amount,
    //     balance: amount
    //   },
    //   update: {
    //     accumulated: { increment: amount },
    //     balance: { increment: amount }
    //   }
    // });

  } catch (error) {
    console.error('Error adding to penalty pool:', error);
    throw error;
  }
}

/**
 * Use insurance pool to cover force majeure costs
 */
export async function useInsurancePool(
  amount: number,
  category: 'driverCompensation' | 'refundLosses' | 'operational',
  month: Date
): Promise<void> {
  try {
    // Get first day of month
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

    // Assuming you have InsurancePool model in schema
    await prisma.insurancePool.upsert({
      where: { month: firstDayOfMonth },
      create: {
        month: firstDayOfMonth,
        collected: 0,
        used: amount,
        balance: -amount,
        [category]: amount
      },
      update: {
        used: { increment: amount },
        balance: { decrement: amount },
        [category]: { increment: amount }
      }
    });

    console.log(`Used €${amount} from insurance pool for ${category}`);

  } catch (error) {
    console.error('Error using insurance pool:', error);
    // Don't throw - we still want to process payment even if tracking fails
  }
}

/**
 * Track insurance fee collection
 */
export async function trackInsuranceFee(
  amount: number,
  month: Date
): Promise<void> {
  try {
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

    await prisma.insurancePool.upsert({
      where: { month: firstDayOfMonth },
      create: {
        month: firstDayOfMonth,
        collected: amount,
        balance: amount,
        used: 0
      },
      update: {
        collected: { increment: amount },
        balance: { increment: amount }
      }
    });

    console.log(`Tracked €${amount} insurance fee for ${month.toISOString()}`);

  } catch (error) {
    console.error('Error tracking insurance fee:', error);
  }
}

/**
 * Calculate distance between airports (simplified)
 * In production, use actual airport coordinates
 */
export async function calculateDistance(
  airportCode1: string,
  airportCode2: string
): Promise<number | null> {
  try {
    // TODO: Implement actual distance calculation
    // For now, return null
    console.log(`Calculate distance: ${airportCode1} to ${airportCode2}`);
    return null;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Verify Payment Intent status
 */
export async function verifyPaymentIntentStatus(
  intentId: string
): Promise<string> {
  try {
    const intent = await stripe.paymentIntents.retrieve(intentId);
    return intent.status;
  } catch (error) {
    console.error('Error verifying payment intent:', error);
    throw error;
  }
}

/**
 * Create idempotency key
 */
export function createIdempotencyKey(
  operation: string,
  memberId: string
): string {
  return `${operation}-${memberId}-${Date.now()}`;
}