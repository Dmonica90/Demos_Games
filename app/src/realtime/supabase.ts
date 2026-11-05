import { createClient } from '@supabase/supabase-js';
import type { CaseId } from '../cases/types';
import type { Conversation } from '../engine/conversation';
import type { Player, Session, SessionStatus, Transport } from './types';
import { newCode, newKey } from './types';

/**
 * Supabase backend: the tables and functions are in
 * `supabase/migrations/001_init.sql`. The anon key is public by design; what a
 * browser may do is limited by row-level security and by the host key, which
 * only the host's browser knows.
 */
type SessionRow = {
  code: string;
  case_id: CaseId;
  status: SessionStatus;
  started_at: string | null;
  duration_s: number;
};
type PlayerRow = {
  id: string;
  session_code: string;
  nickname: string;
  joined_at: string;
  convo: Conversation | null;
};

const toSession = (r: SessionRow): Session => ({
  code: r.code,
  caseId: r.case_id,
  status: r.status,
  startedAt: r.started_at ? Date.parse(r.started_at) : null,
  durationS: r.duration_s,
});
const toPlayer = (r: PlayerRow): Player => ({
  id: r.id,
  sessionCode: r.session_code,
  nickname: r.nickname,
  joinedAt: Date.parse(r.joined_at),
  convo: r.convo,
});

export function supabaseTransport(url: string, anonKey: string): Transport {
  const db = createClient(url, anonKey, { auth: { persistSession: false } });

  const fail = (error: { message: string } | null) => {
    if (error) throw new Error(error.message);
  };

  return {
    kind: 'supabase',
    async createSession(caseId, durationS) {
      // A collision on five characters is unlikely but possible; retry once or twice.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = newCode();
        const hostKey = newKey();
        const { error } = await db.rpc('create_session', {
          p_code: code,
          p_case: caseId,
          p_duration: durationS,
          p_key: hostKey,
        });
        if (!error) return { session: { code, caseId, status: 'lobby', startedAt: null, durationS }, hostKey };
        if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message);
      }
      throw new Error('No se pudo crear la sesión');
    },
    async getSession(code) {
      const { data, error } = await db.from('sessions').select('*').eq('code', code).maybeSingle();
      fail(error);
      return data ? toSession(data as SessionRow) : null;
    },
    async setStatus(code, hostKey, status) {
      const { error } = await db.rpc('set_session_status', { p_code: code, p_key: hostKey, p_status: status });
      fail(error);
    },
    watchSession(code, onChange) {
      const channel = db
        .channel(`session:${code}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `code=eq.${code}` }, (p) => {
          if (p.new && 'code' in p.new) onChange(toSession(p.new as SessionRow));
        })
        .subscribe();
      return () => void db.removeChannel(channel);
    },
    async savePlayer(player) {
      const { error } = await db.from('players').upsert({
        id: player.id,
        session_code: player.sessionCode,
        nickname: player.nickname,
        joined_at: new Date(player.joinedAt).toISOString(),
        convo: player.convo,
        updated_at: new Date().toISOString(),
      });
      fail(error);
    },
    async getPlayer(code, id) {
      const { data, error } = await db.from('players').select('*').eq('session_code', code).eq('id', id).maybeSingle();
      fail(error);
      return data ? toPlayer(data as PlayerRow) : null;
    },
    async listPlayers(code) {
      const { data, error } = await db.from('players').select('*').eq('session_code', code);
      fail(error);
      return (data as PlayerRow[]).map(toPlayer);
    },
    watchPlayers(code, onChange) {
      const channel = db
        .channel(`players:${code}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `session_code=eq.${code}` },
          (p) => {
            if (p.new && 'id' in p.new) onChange(toPlayer(p.new as PlayerRow));
          },
        )
        .subscribe();
      return () => void db.removeChannel(channel);
    },
  };
}
