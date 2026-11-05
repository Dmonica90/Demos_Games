import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config';
import { localTransport } from './local';
import { supabaseTransport } from './supabase';
import type { Transport } from './types';

/**
 * Supabase (the project in `config.ts`, or the build's env vars); with no
 * URL or key, the in-browser backend. `?local=1` forces the in-browser one (the e2e tests use it).
 */
function pick(): Transport {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL;
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || SUPABASE_PUBLISHABLE_KEY;
  const forceLocal = new URLSearchParams(location.search).has('local');
  return url && key && !forceLocal ? supabaseTransport(url, key) : localTransport();
}

export const transport: Transport = pick();
export * from './types';
