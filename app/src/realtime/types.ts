import type { CaseId } from '../cases/types';
import type { Conversation } from '../engine/conversation';

export type SessionStatus = 'lobby' | 'running' | 'finished';

export type Session = {
  code: string;
  caseId: CaseId;
  status: SessionStatus;
  /** Epoch ms when the host started the activity. */
  startedAt: number | null;
  durationS: number;
};

export type Player = {
  id: string;
  sessionCode: string;
  nickname: string;
  joinedAt: number;
  /** Null until the activity starts on this phone. */
  convo: Conversation | null;
};

/**
 * Everything the game needs from the realtime backend. Two implementations:
 * Supabase for real sessions, and a same-browser one (localStorage +
 * BroadcastChannel) for development and the end-to-end tests.
 */
export interface Transport {
  kind: 'supabase' | 'local';
  createSession(caseId: CaseId, durationS: number): Promise<{ session: Session; hostKey: string }>;
  getSession(code: string): Promise<Session | null>;
  setStatus(code: string, hostKey: string, status: SessionStatus): Promise<void>;
  watchSession(code: string, onChange: (session: Session) => void): () => void;
  savePlayer(player: Player): Promise<void>;
  getPlayer(code: string, id: string): Promise<Player | null>;
  listPlayers(code: string): Promise<Player[]>;
  watchPlayers(code: string, onChange: (player: Player) => void): () => void;
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Five characters, without the ones people misread (0/O, 1/I/L). */
export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function newKey(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
