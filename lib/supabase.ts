import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let browserClient: ReturnType<typeof createSupabaseClient> | undefined;

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  return { url, key };
}

export function createClient(accessToken?: string) {
  const { url, key } = config();
  if (accessToken) {
    return createSupabaseClient(url, key, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  browserClient ??= createSupabaseClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return browserClient;
}
