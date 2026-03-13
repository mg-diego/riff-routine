import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { userId, email, name, interval, plan } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userName = name?.trim() || "";

    const customerConfig = userName
      ? { customer_data: { email, name: userName } }
      : { customer_email: email };

    if (plan === 'lifetime') {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID;
      
      if (!priceId) {
        return new NextResponse("Lifetime price ID missing", { status: 400 });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        allow_promotion_codes: true,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro/success?plan=lifetime`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro`,
        client_reference_id: userId,
        ...customerConfig,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    const priceId = interval === 'annual'
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID;

    if (!priceId) {
      return new NextResponse("Price ID missing", { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro/success?plan=pro`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro`,
      client_reference_id: userId,
      ...customerConfig,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}