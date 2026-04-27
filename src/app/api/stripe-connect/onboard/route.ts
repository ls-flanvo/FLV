import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(request: NextRequest) {
  try {
    const payload = await requireDriver(request);

    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Profilo autista non trovato' }, { status: 404 });
    }

    // Crea o recupera Stripe Connected Account
    let accountId = driver.stripeConnectedAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'IT',
        email: driver.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '4121', // Taxi/limousine
          url: process.env.NEXT_PUBLIC_APP_URL,
        },
      });

      accountId = account.id;

      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          stripeConnectedAccountId: accountId,
          stripeAccountStatus: 'pending',
        },
      });
    }

    // Genera link di onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flv-psi.vercel.app';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/driver/dashboard?stripe=refresh`,
      return_url: `${appUrl}/driver/dashboard?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    return authErrorResponse(error);
  }
}
