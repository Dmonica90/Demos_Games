import type { Player, Session, SessionStatus, Transport } from './types';
import { newCode, newKey } from './types';

/**
 * A backend that lives in this browser: every tab of the same site shares it.
 * Good for trying the game alone (one tab as host, others as "phones") and for
 * the end-to-end tests; it cannot reach a real phone.
 */
const PREFIX = 'simcom:';
/**
 * Notes carry the changed record: another tab may hear the broadcast before
 * its copy of localStorage has caught up with the write.
 */
type Note = { kind: 'session'; code: string; session: Session } | { kind: 'player'; code: string; player: Player };

const read = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => localStorage.setItem(PREFIX + key, JSON.stringify(value));

export function localTransport(): Transport {
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('simcom');
  const listeners = new Set<(note: Note) => void>();
  const notify = (note: Note) => {
    for (const l of listeners) l(note);
    channel?.postMessage(note);
  };
  channel?.addEventListener('message', (event: MessageEvent<Note>) => {
    for (const l of listeners) l(event.data);
  });
  const listen = (fn: (note: Note) => void) => {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  };

  // One key per player, so two tabs writing at once never overwrite each other.
  const players = (code: string): Player[] => {
    const prefix = `${PREFIX}player:${code}:`;
    const list: Player[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const p = read<Player>(key.slice(PREFIX.length));
        if (p) list.push(p);
      }
    }
    return list;
  };

  return {
    kind: 'local',
    async createSession(caseId, durationS) {
      const session: Session = { code: newCode(), caseId, status: 'lobby', startedAt: null, durationS };
      const hostKey = newKey();
      write(`session:${session.code}`, session);
      write(`key:${session.code}`, hostKey);
      return { session, hostKey };
    },
    async getSession(code) {
      return read<Session>(`session:${code}`);
    },
    async setStatus(code, hostKey, status: SessionStatus) {
      const session = read<Session>(`session:${code}`);
      if (!session || read<string>(`key:${code}`) !== hostKey) throw new Error('No autorizado');
      const next: Session = { ...session, status, startedAt: status === 'running' ? Date.now() : session.startedAt };
      write(`session:${code}`, next);
      notify({ kind: 'session', code, session: next });
    },
    watchSession(code, onChange) {
      return listen((note) => {
        if (note.kind === 'session' && note.code === code) onChange(note.session);
      });
    },
    async savePlayer(player) {
      const session = read<Session>(`session:${player.sessionCode}`);
      if (!session) throw new Error('La sesión no existe');
      write(`player:${player.sessionCode}:${player.id}`, player);
      notify({ kind: 'player', code: player.sessionCode, player });
    },
    async getPlayer(code, id) {
      return read<Player>(`player:${code}:${id}`);
    },
    async listPlayers(code) {
      return players(code);
    },
    watchPlayers(code, onChange) {
      return listen((note) => {
        if (note.kind === 'player' && note.code === code) onChange(note.player);
      });
    },
  };
}
