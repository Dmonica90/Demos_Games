import { newCode, newKey } from '../../realtime/types';
import * as S from '../state';
import type { CCSession, CCState } from '../types';
import type { CCTransport } from './types';

/**
 * In-browser backend: every tab of this browser shares it through
 * localStorage and BroadcastChannel. Only for tests and trying the game alone;
 * a real session needs Supabase, because phones are other devices.
 */
const PREFIX = 'codigo:';
const read = (code: string): CCState | null => {
  try {
    const raw = localStorage.getItem(`${PREFIX}state:${code}`);
    return raw ? (JSON.parse(raw) as CCState) : null;
  } catch {
    return null;
  }
};
const write = (st: CCState) => localStorage.setItem(`${PREFIX}state:${st.session.code}`, JSON.stringify(st));
const keyOf = (code: string) => localStorage.getItem(`${PREFIX}key:${code}`);

export function localCC(): CCTransport {
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('codigo');
  const listeners = new Set<(s: CCSession) => void>();
  channel?.addEventListener('message', (e: MessageEvent<CCSession>) => listeners.forEach((l) => l(e.data)));
  const notify = (s: CCSession) => {
    listeners.forEach((l) => l(s));
    channel?.postMessage(s);
  };

  /** Read, change and write under a lock, so two tabs never overwrite each other. */
  async function mutate<T>(code: string, fn: (st: CCState) => { state: CCState; out: T }): Promise<T> {
    const run = () => {
      const st = read(code);
      if (!st) throw new Error('La sesión no existe');
      const { state, out } = fn(st);
      if (state !== st) {
        write(state);
        notify(state.session);
      }
      return out;
    };
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(`codigo:${code}`, run);
    return run();
  }
  const host = (code: string, key: string) => {
    if (keyOf(code) !== key) throw new Error('No autorizado');
  };
  const id = () => crypto.randomUUID();

  return {
    kind: 'local',
    async create() {
      const code = newCode();
      const hostKey = newKey();
      write(S.createState(code));
      localStorage.setItem(`${PREFIX}key:${code}`, hostKey);
      return { code, hostKey };
    },
    confirm: (code, key, slots, overflow) =>
      mutate(code, (st) => (host(code, key), { state: S.confirm(st, slots, overflow), out: undefined })),
    set: (code, key, patch) => mutate(code, (st) => (host(code, key), { state: S.setSession(st, patch), out: undefined })),
    async hostView(code, key) {
      host(code, key);
      const st = read(code);
      if (!st) throw new Error('La sesión no existe');
      return S.hostView(st);
    },
    markRescue: (code, key, rid, ok) =>
      mutate(code, (st) => (host(code, key), { state: S.markRescue(st, rid, ok), out: undefined })),
    setAuditor: (code, key, pid, on) =>
      mutate(code, (st) => (host(code, key), { state: S.setAuditor(st, pid, on), out: undefined })),
    close: (code, key) => mutate(code, (st) => (host(code, key), { state: S.close(st), out: undefined })),
    async getSession(code) {
      return read(code)?.session ?? null;
    },
    async board(code) {
      const st = read(code);
      return st ? S.boardView(st) : null;
    },
    join: (code, name, claim) =>
      mutate(code, (st) => {
        const { state, result } = S.join(st, name, claim, id(), Date.now());
        return { state, out: result };
      }),
    async me(code, token) {
      const st = read(code);
      return st ? S.playerView(st, token) : null;
    },
    vote: (code, token, num) => mutate(code, (st) => ({ state: S.vote(st, token, num), out: undefined })),
    rescue: (code, token, answer) =>
      mutate(code, (st) => ({ state: S.rescue(st, token, answer, id(), Date.now()), out: undefined })),
    allies: (code, token, nums) => mutate(code, (st) => ({ state: S.allies(st, token, nums, Date.now()), out: undefined })),
    watch(code, onChange) {
      const fn = (s: CCSession) => s.code === code && onChange(s);
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
  };
}
