import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { useInsurancePool, calculateDistance } from '@/lib/payment-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Validation schema
const forceMajeureSchema = z.object({
  groupId: z.string().cuid(),
  reason: z.enum(['FLIGHT_CANCELLED', 'FLIGHT_DIVERTED']),
  newAirportCode: z.string().optional(), // For diversions
  details: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { groupId, reason, newAirportCode, details } = forceMajeureSchema.parse(body);

    // Get RideGroup with all members and ride info
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            booking: {
              include: {
                user: true
              }
            }
          }
        },
        ride: {
          include: {
            driver: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'RideGroup not found' },
        { status: 404 }
      );
    }

    const driverAssigned = !!group.ride?.driverId;
    const driverAssignedTime = group.ride?.confirmedAt;

    // Determine if driver was already assigned (T-15 passed)
    const needsDriverCompensation = driverAssigned && driverAssignedTime;

    let totalRefunded = 0;
    let membersCancelled = 0;

    // Cancel all payment intents and refund 100%
    for (const member of group.members) {
      if (!member.paymentIntentId) continue;
      
      try {
        // Cancel payment intent (if still in authorized state)
        if (member.paymentStatus === 'AUTHORIZED') {
          await stripe.paymentIntents.cancel(member.paymentIntentId);
          
          await prisma.groupMember.update({
            where: { id: member.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'REFUNDED'
            }
          });

          totalRefunded += member.totalPrice || 0;
          membersCancelled++;

          console.log(`Force majeure: cancelled intent ${member.paymentIntentId} - €${member.totalPrice}`);
        } else if (member.paymentStatus === 'PAID') {
          // Already captured (rare), create refund
          const refund = await stripe.refunds.create({
            payment_intent: member.paymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              type: 'FORCE_MAJEURE',
              reason,
              groupId
            }
          });

          await prisma.groupMember.update({
            where: { id: member.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'REFUNDED'
            }
          });

          totalRefunded += member.totalPrice || 0;
          membersCancelled++;

          console.log(`Force majeure: refunded ${refund.id} - €${member.totalPrice}`);
        }

        // TODO: Send refund notification
        // await sendForceMajeureEmail(member.booking.user.email, {
        //   reason,
        //   refundAmount: member.totalPrice
        // });

      } catch (error: any) {
        console.error(`Failed to process member ${member.id}:`, error);
        // Continue with other members
      }
    }

    // Compensate driver if already assigned
    let driverCompensation = 0;
    if (needsDriverCompensation && group.ride?.driver) {
      driverCompensation = group.totalRouteKm ? group.totalRouteKm * 2.00 : 70; // fallback €70

      try {
        // Use insurance pool to compensate driver
        await useInsurancePool(
          driverCompensation,
          'driverCompensation',
          new Date()
        );

        // Transfer to driver
        if (group.ride.driver.stripeConnectedAccountId) {
          const transfer = await stripe.transfers.create({
            amount: Math.round(driverCompensation * 100),
            currency: 'eur',
            destination: group.ride.driver.stripeConnectedAccountId,
            metadata: {
              type: 'FORCE_MAJEURE_COMPENSATION',
              groupId,
              reason,
              details: details || ''
            }
          });

          console.log(`Driver compensation: ${transfer.id} - €${driverCompensation}`);
        }

      } catch (error: any) {
        console.error('Failed to compensate driver:', error);
      }
    }

    // Update RideGroup status
    await prisma.rideGroup.update({
      where: { id: groupId },
      data: {
        status: 'CANCELLED'
      }
    });

    // Audit log
    await prisma.priceAuditLog.create({
      data: {
        rideGroupId: groupId,
        routeVersion: group.routeVersion,
        totalRouteKm: group.totalRouteKm || 0,
        baseFarePerKm: 0,
        totalBaseFare: 0,
        driverRatePerKm: 2.00,
        totalDriverPay: driverCompensation,
        flanvoFeeRate: 0,
        flanvoFee: 0,
        finalPrice: 0,
        maxDetourPercent: 20,
        maxDetourMinutes: 10,
        constraintsMet: false,
        calculatedBy: 'system',
        notes: `FORCE MAJEURE: ${reason}. Refunded ${membersCancelled} members (€${totalRefunded}). Driver compensation: €${driverCompensation}. ${details || ''}`
      }
    });

    // Handle flight diversion - offer rebooking
    let rebookingOffered = false;
    if (reason === 'FLIGHT_DIVERTED' && newAirportCode) {
      const distance = await calculateDistance(
        group.flightNumber.substring(0, 3), // original airport (rough estimate)
        newAirportCode
      );

      if (distance && distance < 100) {
        // Same corridor - offer free rebooking
        rebookingOffered = true;
        
        // TODO: Search for new pool from diverted airport
        // TODO: Send rebooking offer emails
        console.log(`Rebooking opportunity: diverted to ${newAirportCode} (${distance}km away)`);
      }
    }

    return NextResponse.json({
      success: true,
      reason,
      membersCancelled,
      totalRefunded,
      driverCompensated: needsDriverCompensation,
      driverCompensation: needsDriverCompensation ? driverCompensation : 0,
      rebookingOffered,
      message: `Force majeure processed: ${reason}. Refunded 100% to ${membersCancelled} passengers.${needsDriverCompensation ? ` Driver compensated €${driverCompensation}.` : ''}`
    });

  } catch (error: any) {
    console.error('Force majeure handling error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Force majeure processing failed' },
      { status: 500 }
    );
  }
}