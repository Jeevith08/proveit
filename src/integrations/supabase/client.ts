import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Resolve env vars: import.meta.env works for client bundle (Vite replaces at build),
// process.env fallback covers the SSR server where VITE_ prefix vars are not in process.env.
const SUPABASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_SUPABASE_URL']) ||
  (typeof process !== 'undefined' && (process.env?.['SUPABASE_URL'] ?? process.env?.['VITE_SUPABASE_URL']))
) as string | undefined;

const SUPABASE_ANON_KEY = (
  (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_SUPABASE_ANON_KEY']) ||
  (typeof process !== 'undefined' && (process.env?.['SUPABASE_ANON_KEY'] ?? process.env?.['VITE_SUPABASE_ANON_KEY']))
) as string | undefined;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL / VITE_SUPABASE_URL'] : []),
      ...(!SUPABASE_ANON_KEY ? ['SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY'] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(', ')}`);
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  });
}

// Lazily created singleton — avoids module-level throws during SSR startup.
let _client: ReturnType<typeof getSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof getSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_client) _client = getSupabaseClient();
    return Reflect.get(_client, prop, receiver);
  },
});
