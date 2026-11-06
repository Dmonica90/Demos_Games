import type { BoardView, CCSession, HostView, JoinResult, PlayerView, RoleId, SessionPatch, Slot } from '../types';

/**
 * What Código Clip needs from its backend. Supabase for real sessions (every
 * call is a database function; no table is readable from the browser except
 * the public session row), and an in-browser one for tests and offline demos.
 */
export interface CCTransport {
  kind: 'supabase' | 'local';
  create(): Promise<{ code: string; hostKey: string }>;
  confirm(code: string, key: string, slots: Slot[], overflow: RoleId[]): Promise<void>;
  set(code: string, key: string, patch: SessionPatch): Promise<void>;
  hostView(code: string, key: string): Promise<HostView>;
  markRescue(code: string, key: string, rescueId: string, ok: boolean): Promise<void>;
  setAuditor(code: string, key: string, playerId: string, on: boolean): Promise<void>;
  close(code: string, key: string): Promise<void>;

  getSession(code: string): Promise<CCSession | null>;
  /** The projected screen: names and life bars, no roles or votes. */
  board(code: string): Promise<BoardView | null>;
  join(code: string, name: string, claim: boolean): Promise<JoinResult>;
  me(code: string, token: string): Promise<PlayerView | null>;
  vote(code: string, token: string, targetNum: number): Promise<void>;
  rescue(code: string, token: string, answer: string): Promise<void>;
  /** "¿Quién es de tu equipo?": the numbers this player picks. */
  allies(code: string, token: string, nums: number[]): Promise<void>;

  /** Calls back whenever anything in the session changed. */
  watch(code: string, onChange: (session: CCSession) => void): () => void;
}
