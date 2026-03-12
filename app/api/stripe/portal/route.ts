import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization') ?? '';
        const token = authHeader.replace('Bearer ', '');
        console.log('[portal] token present:', !!token);

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        console.log('[portal] user:', user?.id, 'authError:', authError?.message);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();
        console.log('[portal] stripe_customer_id:', profile?.stripe_customer_id, 'profileError:', profileError?.message);

        if (!profile?.stripe_customer_id) {
            return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
        });
        console.log('[portal] session url:', session.url);

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('[portal] caught error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}