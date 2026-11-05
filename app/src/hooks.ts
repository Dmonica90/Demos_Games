import { useEffect, useState } from 'react';
import { transport } from './realtime';
import type { Player, Session } from './realtime';

/** The session, live. `undefined` while loading, `null` if it does not exist. */
export function useSession(code: string) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setSession(undefined);
    transport
      .getSession(code)
      .then((s) => alive && setSession(s))
      .catch((e: Error) => alive && setError(e.message));
    const stop = transport.watchSession(code, (s) => alive && setSession(s));
    return () => {
      alive = false;
      stop();
    };
  }, [code]);
  return { session, error };
}

/** Every player in the session, live, in joining order. */
export function usePlayers(code: string) {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  useEffect(() => {
    let alive = true;
    setPlayers({});
    transport
      .listPlayers(code)
      .then((list) => alive && setPlayers((prev) => ({ ...Object.fromEntries(list.map((p) => [p.id, p])), ...prev })))
      .catch(() => undefined);
    const stop = transport.watchPlayers(code, (p) => alive && setPlayers((prev) => ({ ...prev, [p.id]: p })));
    return () => {
      alive = false;
      stop();
    };
  }, [code]);
  return Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
}

/** The current time, ticking. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function remainingMs(session: Session, now: number): number {
  if (!session.startedAt) return session.durationS * 1000;
  return Math.max(0, session.startedAt + session.durationS * 1000 - now);
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Small wrapper over browser storage that never throws. A phone remembers who
 * it is in localStorage, so it survives closing the tab; in local mode, where
 * every "phone" is a tab of the same browser, each tab keeps its own identity
 * in sessionStorage instead.
 */
const area = (): Storage => (transport.kind === 'local' ? sessionStorage : localStorage);

export const store = {
  get(key: string): string | null {
    try {
      return area().getItem(`simcom:${key}`) ?? localStorage.getItem(`simcom:${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      area().setItem(`simcom:${key}`, value);
    } catch {
      // Without storage the game still works; it just cannot resume after a reload.
    }
  },
};
