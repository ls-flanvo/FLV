import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function GET(request: NextRequest) {
  try {
    const payload = await requireDriver(request);

    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
      select: {
        stripeConnectedAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
        stripePayoutsEnabled: true,
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver non trovato' }, { status: 404 });
    }

    if (!driver.stripeConnectedAccountId) {
      return NextResponse.json({ status: 'not_started', payoutsEnabled: false });
    }

    // Verifica stato aggiornato da Stripe
    const account = await stripe.accounts.retrieve(driver.stripeConnectedAccountId);
    const payoutsEnabled = account.payouts_enabled ?? false;
    const onboardingComplete = account.details_submitted ?? false;

    await prisma.driver.update({
      where: { userId: payload.userId },
      data: {
        stripePayoutsEnabled: payoutsEnabled,
        stripeOnboardingComplete: onboardingComplete,
        stripeAccountStatus: payoutsEnabled ? 'active' : onboardingComplete ? 'pending' : 'incomplete',
      },
    });

    return NextResponse.json({
      status: payoutsEnabled ? 'active' : onboardingComplete ? 'pending_verification' : 'incomplete',
      payoutsEnabled,
      onboardingComplete,
      accountId: driver.stripeConnectedAccountId,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
