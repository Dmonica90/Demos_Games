/**
 * The Supabase project the published game uses. Both values are public by
 * design: they ship inside the page, and what a browser may do is limited by
 * the row-level security in `supabase/migrations/001_init.sql`. Never put the
 * project's secret (service_role / sb_secret_…) key here or anywhere in the repo.
 *
 * `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` override these at build time.
 */
export const SUPABASE_URL = 'https://pemneonehpevuotynewc.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RhDhwVU_vnY8OOt83eFpmA_XLgxzw8T';
