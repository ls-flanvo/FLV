import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    // Get GroupMember with full pricing details
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

    // Calculate detour percentage
    const detourPercent = member.kmDirect && member.kmOnboard
      ? ((member.kmOnboard - member.kmDirect) / member.kmDirect) * 100
      : 0;

    // Build comprehensive breakdown
    const breakdown = {
      // Member Info
      memberId: member.id,
      bookingId: member.bookingId,
      groupId: member.rideGroupId,
      userId: member.booking.userId,
      userName: member.booking.user.name,
      
      // Status
      status: member.status,
      paymentStatus: member.paymentStatus,
      paymentIntentId: member.paymentIntentId,
      
      // Distance Metrics
      kmOnboard: member.kmOnboard,
      kmDirect: member.kmDirect,
      detourKm: member.detourKm,
      detourPercent: Math.round(detourPercent * 100) / 100,
      extraMinutes: member.extraMinutes,
      
      // Pricing Breakdown
      pricing: {
        driverShare: member.driverShare,
        driverSharePerKm: member.driverShare && member.kmOnboard 
          ? Math.round((member.driverShare / member.kmOnboard) * 100) / 100
          : null,
        
        flanvoFee: member.flanvoFee,
        flanvoFeeRate: member.flanvoFeeRate,
        flanvoFeePerKm: member.flanvoFee && member.kmOnboard
          ? Math.round((member.flanvoFee / member.kmOnboard) * 100) / 100
          : null,
        
        protectionFee: 1.00,
        
        totalPrice: member.totalPrice,
        pennyAdjustment: member.pennyAdjustment || 0
      },
      
      // Payment Details
      payment: {
        capturedAmount: member.paymentStatus === 'PAID' ? member.totalPrice : null,
        capturedAt: member.capturedAt,
        refundedAmount: member.paymentStatus === 'REFUNDED' 
          ? (member.totalPrice! - (member.driverShare || 0)) // flanvo fee + protection refunded
          : null
      },
      
      // Pool Context
      poolContext: {
        totalMembers: member.rideGroup.members.length,
        currentCapacity: member.rideGroup.currentCapacity,
        totalRouteKm: member.rideGroup.totalRouteKm,
        flightNumber: member.rideGroup.flightNumber,
        targetPickupTime: member.rideGroup.targetPickupTime,
        groupStatus: member.rideGroup.status
      },
      
      // Passenger Details
      booking: {
        numPassengers: member.booking.passengers,
        luggage: member.booking.luggage,
        pickupLocation: member.booking.pickupLocation,
        dropoffLocation: member.booking.dropoffLocation,
        flightNumber: member.booking.flightNumber,
        flightDate: member.booking.flightDate
      },
      
      // Timing
      timing: {
        estimatedPickupTime: member.estimatedPickupTime,
        actualPickupTime: member.actualPickupTime,
        estimatedDropoffTime: member.estimatedDropoffTime,
        actualDropoffTime: member.actualDropoffTime,
        joinedAt: member.joinedAt
      }
    };

    return NextResponse.json({
      success: true,
      breakdown
    });

  } catch (error: any) {
    console.error('Breakdown error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve breakdown' },
      { status: 500 }
    );
  }
}