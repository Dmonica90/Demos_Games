import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../config';
import { localCC } from './local';
import { supabaseCC } from './supabase';
import type { CCTransport } from './types';

/** Same choice as the simulator: Supabase unless `?local=1` (tests) or no config. */
function pick(): CCTransport {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL;
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || SUPABASE_PUBLISHABLE_KEY;
  const forceLocal = new URLSearchParams(location.search).has('local');
  return url && key && !forceLocal ? supabaseCC(url, key) : localCC();
}

export const cc: CCTransport = pick();
export type { CCTransport } from './types';
