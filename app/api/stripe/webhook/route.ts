import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getPeriodEnd = (subscription: Stripe.Subscription): string | null => {
    const item = subscription.items?.data?.[0] as any;
    const periodEnd = item?.current_period_end ?? item?.period?.end;
    return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
};

export async function POST(req: Request) {
    const body      = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('[webhook] signature error:', error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // ── checkout.session.completed ──────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
        const session    = event.data.object as Stripe.Checkout.Session;
        const userId     = session.client_reference_id;
        const customerId = session.customer as string;

        if (!userId) {
            console.error('[webhook] checkout.session.completed: missing client_reference_id');
            return new NextResponse(null, { status: 200 });
        }

        // LIFETIME — mode: 'payment' (one-time purchase, no subscription)
        if (session.mode === 'payment') {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_tier:      'lifetime',
                    stripe_customer_id:     customerId,
                    stripe_subscription_id: null,   // no subscription for lifetime
                    premium_until:          null,   // never expires
                })
                .eq('id', userId);

            if (error) console.error('[webhook] lifetime update error:', error);
            else console.log('[webhook] lifetime activated for user:', userId);
        }

        // PRO — mode: 'subscription' (recurring)
        if (session.mode === 'subscription') {
            const subscriptionId = session.subscription as string;
            const subscription   = await stripe.subscriptions.retrieve(subscriptionId);

            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_tier:      'pro',
                    stripe_customer_id:     customerId,
                    stripe_subscription_id: subscriptionId,
                    premium_until:          getPeriodEnd(subscription),
                })
                .eq('id', userId);

            if (error) console.error('[webhook] pro update error:', error);
            else console.log('[webhook] pro activated for user:', userId, '| premium_until:', getPeriodEnd(subscription));
        }
    }

    // ── customer.subscription.updated ──────────────────────────────────────
    // Only affects PRO — lifetime has no subscription so this never fires for them
    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                premium_until: getPeriodEnd(subscription),
            })
            .eq('stripe_subscription_id', subscription.id);

        if (error) console.error('[webhook] subscription.updated error:', error);
        else console.log('[webhook] premium_until updated:', getPeriodEnd(subscription));
    }

    // ── customer.subscription.deleted ──────────────────────────────────────
    // Only affects PRO — lifetime users are never downgraded by this event
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;

        // Guard: don't downgrade a lifetime user if somehow their old sub gets deleted
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('subscription_tier')
            .eq('stripe_subscription_id', subscription.id)
            .single();

        if (profile?.subscription_tier === 'lifetime') {
            console.log('[webhook] skipping downgrade — user is lifetime:', subscription.id);
            return new NextResponse(null, { status: 200 });
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                subscription_tier:      'free',
                stripe_subscription_id: null,
                premium_until:          null,
            })
            .eq('stripe_subscription_id', subscription.id);

        if (error) console.error('[webhook] subscription.deleted error:', error);
        else console.log('[webhook] user downgraded to free:', subscription.id);
    }

    return new NextResponse(null, { status: 200 });
}