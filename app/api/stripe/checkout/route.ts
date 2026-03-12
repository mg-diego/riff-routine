import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { userId, email, interval, plan } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ── LIFETIME — one-time payment ──
    if (plan === 'lifetime') {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID;
      if (!priceId) return new NextResponse("Lifetime price ID missing", { status: 400 });

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro/success?plan=lifetime`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro`,
        client_reference_id: userId,
        customer_email: email,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    // ── PRO — recurring subscription ──
    const priceId = interval === 'annual'
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID;

    if (!priceId) return new NextResponse("Price ID missing", { status: 400 });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro/success?plan=pro`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro`,
      client_reference_id: userId,
      customer_email: email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[checkout] error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}