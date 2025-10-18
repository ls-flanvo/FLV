import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Validation schema
const createIntentSchema = z.object({
  memberId: z.string().cuid()
});

// GET FLANVO RATE (tiered)
function getFlanvoRate(km: number): number {
  if (km >= 100) return 0.20;
  if (km >= 51) return 0.25;
  return 0.30;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId } = createIntentSchema.parse(body);
    console.log('✅ MemberId ricevuto:', memberId);

    // Get GroupMember with pricing data
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        booking: {
          include: {
            user: true
          }
        },
        rideGroup: {
          include: {
            members: true
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'GroupMember not found' },
        { status: 404 }
      );
    }

    console.log('✅ Member trovato:', {
      id: member.id,
      paymentIntentId: member.paymentIntentId,
      groupStatus: member.rideGroup.status
    });

    // ✅ FIXED: Permetti payment per FORMING, READY e CONFIRMED
    const allowedStatuses = ['FORMING', 'READY', 'CONFIRMED'];
    if (!allowedStatuses.includes(member.rideGroup.status)) {
      console.log('❌ Group status non valido per payment:', member.rideGroup.status);
      return NextResponse.json(
        { error: `Group status must be FORMING, READY or CONFIRMED. Current: ${member.rideGroup.status}` },
        { status: 400 }
      );
    }

    // Check if payment intent already exists
    if (member.paymentIntentId) {
      console.log('ℹ️ Payment intent già esistente:', member.paymentIntentId);
      
      // Recupera il payment intent esistente da Stripe
      const existingIntent = await stripe.paymentIntents.retrieve(member.paymentIntentId);
      
      return NextResponse.json({
        success: true,
        clientSecret: existingIntent.client_secret,
        intentId: existingIntent.id,
        amount: existingIntent.amount / 100,
        message: 'Payment intent already exists'
      });
    }

    // ✅ Se non ci sono ancora pricing data (gruppo appena creato), calcoliamo valori temporanei
    let driverShare = member.driverShare;
    let kmOnboard = member.kmOnboard;
    
    if (!driverShare || !kmOnboard) {
      console.log('⚠️ Pricing data non ancora calcolato, uso valori temporanei');
      
      // Calcola distanza diretta approssimativa (Haversine)
      const R = 6371; // Earth radius in km
      const lat1 = member.booking.pickupLat * Math.PI / 180;
      const lat2 = member.booking.dropoffLat * Math.PI / 180;
      const deltaLat = (member.booking.dropoffLat - member.booking.pickupLat) * Math.PI / 180;
      const deltaLng = (member.booking.dropoffLng - member.booking.pickupLng) * Math.PI / 180;
      
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      kmOnboard = distance;
      driverShare = distance * 2.00; // €2.00/km driver rate
      
      console.log('📍 Distanza calcolata:', distance, 'km');
    }

    const flanvoFeeRate = getFlanvoRate(kmOnboard);
    const flanvoFee = kmOnboard * flanvoFeeRate;
    const protectionFee = 1.00;
    const totalPrice = driverShare + flanvoFee + protectionFee;

    console.log('💰 Pricing calcolato:', {
      driverShare,
      kmOnboard,
      flanvoFeeRate,
      flanvoFee,
      protectionFee,
      totalPrice
    });

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'eur',
      capture_method: 'manual', // CRITICAL: manual capture
      metadata: {
        groupId: member.rideGroupId,
        memberId: member.id,
        bookingId: member.bookingId,
        kmOnboard: kmOnboard.toString(),
        driverShare: driverShare.toFixed(2),
        flanvoFee: flanvoFee.toFixed(2),
        flanvoFeeRate: flanvoFeeRate.toString(),
        protectionFee: protectionFee.toFixed(2),
        flightNumber: member.rideGroup.flightNumber,
        numPassengers: member.booking.passengers.toString()
      },
      description: `Flanvo Pool - Flight ${member.rideGroup.flightNumber}`
    });

    console.log('✅ Payment Intent creato:', paymentIntent.id);

    // Save intentId in GroupMember
    await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'PENDING',
        driverShare,
        flanvoFee,
        flanvoFeeRate,
        totalPrice,
        kmOnboard,
        kmDirect: member.kmDirect || kmOnboard // Se non c'è ancora, usa lo stesso valore
      }
    });

    // Create audit log
    await prisma.priceAuditLog.create({
      data: {
        rideGroupId: member.rideGroupId,
        bookingId: member.bookingId,
        routeVersion: member.rideGroup.routeVersion,
        totalRouteKm: member.rideGroup.totalRouteKm || kmOnboard,
        directKm: member.kmDirect || kmOnboard,
        detourKm: member.detourKm || 0,
        detourPercent: member.detourPercent || 0,
        baseFarePerKm: flanvoFeeRate,
        totalBaseFare: flanvoFee,
        driverRatePerKm: 2.00,
        totalDriverPay: driverShare,
        flanvoFeeRate: flanvoFeeRate,
        flanvoFee: flanvoFee,
        finalPrice: totalPrice,
        maxDetourPercent: member.booking.maxDetourPercent,
        maxDetourMinutes: member.booking.maxDetourMinutes,
        constraintsMet: true,
        calculatedBy: 'system',
        notes: `Payment Intent created: ${paymentIntent.id} (status: ${member.rideGroup.status})`
      }
    });

    console.log('✅ Tutto salvato! Ritorno risposta.');

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
      amount: totalPrice,
      breakdown: {
        driverShare,
        flanvoFee,
        flanvoFeeRate,
        protectionFee,
        totalPrice,
        kmOnboard
      }
    });

  } catch (error: any) {
    console.error('❌ Create intent error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment request', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}