// Server-side: crée un client Supabase authentifié avec le JWT Clerk
import { auth } from '@clerk/nextjs/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClerkSupabaseClient() {
  const { getToken } = await auth();

  // Graceful fallback if 'supabase' JWT template is not configured in Clerk Dashboard
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (err) {
    console.warn(
      '[Supabase] Clerk JWT template "supabase" not found — queries will use anon key (RLS may block). ' +
      'Configure it at: Clerk Dashboard → JWT Templates → New template → supabase'
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
    }
  );
}
