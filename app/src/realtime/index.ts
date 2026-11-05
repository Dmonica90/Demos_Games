import { localTransport } from './local';
import { supabaseTransport } from './supabase';
import type { Transport } from './types';

/**
 * Supabase when the build has its URL and key; otherwise the in-browser
 * backend. `?local=1` forces the in-browser one (the e2e tests use it).
 */
function pick(): Transport {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const forceLocal = new URLSearchParams(location.search).has('local');
  return url && key && !forceLocal ? supabaseTransport(url, key) : localTransport();
}

export const transport: Transport = pick();
export * from './types';
