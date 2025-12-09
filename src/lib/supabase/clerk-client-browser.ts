// Client-side: utilise useAuth de Clerk pour obtenir le token Supabase
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          return await getToken({ template: 'supabase' }) ?? null;
        },
      }
    );
  }, [getToken]);
}
