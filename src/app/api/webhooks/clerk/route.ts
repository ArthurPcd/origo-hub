import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
  };
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Verify Svix signature
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(secret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error('Clerk webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'user.created') {
    const userId = event.data.id;
    try {
      const supabase = getServiceClient();
      const { error } = await supabase.from('user_subscriptions').insert({
        user_id: userId,
        plan: 'free',
        status: 'active',
        brief_count: 0,
      });

      if (error && error.code !== '23505') {
        // 23505 = unique violation (user already exists — safe to ignore)
        console.error(`Failed to create subscription for user ${userId}:`, error);
        return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
      }

      console.log(`Created free subscription for user ${userId}`);
    } catch (err) {
      console.error('Clerk webhook processing error:', err);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  if (event.type === 'user.deleted') {
    // Supabase will cascade-delete via FK if the migration is applied
    // Log for audit trail
    console.log(`User deleted: ${event.data.id}`);
  }

  return NextResponse.json({ received: true });
}
