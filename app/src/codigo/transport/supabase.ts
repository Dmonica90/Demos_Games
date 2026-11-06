import { createClient } from '@supabase/supabase-js';
import { newCode, newKey } from '../../realtime/types';
import type { CCSession, HostView, JoinResult, PlayerView } from '../types';
import type { CCTransport } from './types';

/**
 * Supabase backend: `supabase/migrations/002_codigo_clip.sql`. The browser only
 * reads `cc_sessions` (public, no secrets) and listens to it; everything else
 * goes through functions that check the host key or the player's token.
 */
type Row = {
  code: string;
  status: CCSession['status'];
  total: number;
  section: number;
  round_open: boolean;
  vote_round: number;
  vote_open: boolean;
  points_on: boolean;
  sale_open: boolean;
  rev: number;
};
const toSession = (r: Row): CCSession => ({
  code: r.code,
  status: r.status,
  total: r.total,
  section: r.section,
  roundOpen: r.round_open,
  voteRound: r.vote_round,
  voteOpen: r.vote_open,
  pointsOn: r.points_on,
  saleOpen: r.sale_open,
  rev: r.rev,
});

export function supabaseCC(url: string, anonKey: string): CCTransport {
  const db = createClient(url, anonKey, { auth: { persistSession: false } });
  // A phone watches the session twice (its view and the public row). Supabase
  // refuses a second channel with the same name, so each watch gets its own.
  let channels = 0;
  async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data as T;
  }

  return {
    kind: 'supabase',
    async create() {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = newCode();
        const hostKey = newKey();
        const { error } = await db.rpc('cc_create', { p_code: code, p_key: hostKey });
        if (!error) return { code, hostKey };
        if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message);
      }
      throw new Error('No se pudo crear la sesión');
    },
    confirm: (code, key, slots, overflow) => call('cc_confirm', { p_code: code, p_key: key, p_slots: slots, p_overflow: overflow }),
    set: (code, key, patch) => call('cc_set', { p_code: code, p_key: key, p_patch: patch }),
    hostView: (code, key) => call<HostView>('cc_host_view', { p_code: code, p_key: key }),
    markRescue: (code, key, rid, ok) => call('cc_mark_rescue', { p_code: code, p_key: key, p_rescue: rid, p_ok: ok }),
    setAuditor: (code, key, pid, on) => call('cc_set_auditor', { p_code: code, p_key: key, p_player: pid, p_on: on }),
    close: (code, key) => call('cc_close', { p_code: code, p_key: key }),
    async getSession(code) {
      const { data, error } = await db.from('cc_sessions').select('*').eq('code', code).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toSession(data as Row) : null;
    },
    join: (code, name, claim) => call<JoinResult>('cc_join', { p_code: code, p_name: name, p_claim: claim }),
    me: (code, token) => call<PlayerView | null>('cc_me', { p_code: code, p_token: token }),
    vote: (code, token, num) => call('cc_vote', { p_code: code, p_token: token, p_target: num }),
    rescue: (code, token, answer) => call('cc_rescue', { p_code: code, p_token: token, p_answer: answer }),
    sale: (code, token, num, criteria, convinced) =>
      call('cc_sale', { p_code: code, p_token: token, p_seller: num, p_criteria: criteria, p_convinced: convinced }),
    watch(code, onChange) {
      const channel = db
        .channel(`cc:${code}:${(channels += 1)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cc_sessions', filter: `code=eq.${code}` }, (p) => {
          if (p.new && 'code' in p.new) onChange(toSession(p.new as Row));
        })
        .subscribe();
      return () => void db.removeChannel(channel);
    },
  };
}
