import { useCallback, useEffect, useState } from 'react';
import { cc } from './transport';
import type { BoardView, CCSession, HostView, PlayerView } from './types';

/**
 * Live views of a Código Clip session. Every change bumps the session's `rev`;
 * the watchers refetch on it, and a slow poll covers a dropped connection.
 */
function useLive<T>(code: string, load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const fetchNow = useCallback(load, deps);
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      fetchNow()
        .then((d) => {
          if (!alive) return;
          setData(d);
          setError(null);
        })
        .catch((e: Error) => alive && setError(e.message));
    void refresh();
    const stop = cc.watch(code, () => void refresh());
    const poll = setInterval(refresh, cc.kind === 'local' ? 1500 : 5000);
    return () => {
      alive = false;
      stop();
      clearInterval(poll);
    };
  }, [code, fetchNow]);
  return { data, error, refresh: fetchNow };
}

export const useCCSession = (code: string) => useLive<CCSession | null>(code, () => cc.getSession(code), [code]);

export const useBoard = (code: string) => useLive<BoardView | null>(code, () => cc.board(code), [code]);

export const useHostView = (code: string, key: string | null) =>
  useLive<HostView | null>(code, () => (key ? cc.hostView(code, key) : Promise.resolve(null)), [code, key]);

export const usePlayerView = (code: string, token: string | null) =>
  useLive<PlayerView | null>(code, () => (token ? cc.me(code, token) : Promise.resolve(null)), [code, token]);

/** Small storage wrapper: sessionStorage in local mode (each tab is a phone). */
const area = (): Storage => (cc.kind === 'local' ? sessionStorage : localStorage);
export const ccStore = {
  get(key: string): string | null {
    try {
      return area().getItem(`codigo:${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) area().removeItem(`codigo:${key}`);
      else area().setItem(`codigo:${key}`, value);
    } catch {
      // Without storage the name still brings the character back.
    }
  },
};
