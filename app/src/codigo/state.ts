import { LIFE, MERCHANT_ROLES, MIN_PLAYERS, RESCUE_SECTIONS, SALE_CRITERIA, SECTIONS } from './content';
import type {
  BoardView,
  CCPlayer,
  CCState,
  HostView,
  JoinResult,
  PlayerView,
  RoleId,
  SessionPatch,
  Slot,
} from './types';

/**
 * The rules of a session, as pure functions over its state. The in-browser
 * backend runs them directly; the Supabase functions in
 * `supabase/migrations/002_codigo_clip.sql` do the same steps in SQL. Each
 * function returns the next state or throws a message for the person.
 */
export function createState(code: string): CCState {
  return {
    session: {
      code,
      status: 'registro',
      total: 0,
      section: 0,
      roundOpen: false,
      voteRound: 0,
      voteOpen: false,
      pointsOn: true,
      saleOpen: false,
      rev: 0,
    },
    slots: [],
    overflow: [],
    players: [],
    votes: [],
    rescues: [],
    sales: [],
  };
}

const bump = (st: CCState): CCState => ({ ...st, session: { ...st.session, rev: st.session.rev + 1 } });

const open = (st: CCState) => {
  if (st.session.status !== 'jugando') throw new Error('La sesión no está abierta');
};

export function confirm(st: CCState, slots: Slot[], overflow: RoleId[]): CCState {
  if (st.session.status !== 'registro') throw new Error('Los roles ya se repartieron');
  if (slots.length < MIN_PLAYERS) throw new Error(`Se juega con al menos ${MIN_PLAYERS} personas`);
  if (!slots.some((x) => x.role === 'phishing')) throw new Error('Debe haber al menos un infiltrado');
  if (overflow.includes('phishing')) throw new Error('Quien llega tarde no puede ser phishing');
  return bump({ ...st, slots, overflow, session: { ...st.session, status: 'jugando', total: slots.length } });
}

export function setSession(st: CCState, patch: SessionPatch): CCState {
  open(st);
  const s = st.session;
  const section = patch.section ?? s.section;
  if (section < 0 || section >= SECTIONS.length) throw new Error('Sección inválida');
  const voteOpen = patch.voteOpen ?? s.voteOpen;
  // Opening the vote starts a new round; each person votes once per round.
  const voteRound = voteOpen && !s.voteOpen ? s.voteRound + 1 : s.voteRound;
  return bump({ ...st, session: { ...s, ...patch, section, voteOpen, voteRound } });
}

/** Names are compared without case, accents or extra spaces. */
export const normName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Joining with a name already in the session: `claim` says "yes, that's me"
 * and returns that player (this is how a phone gets its character back);
 * without it, the phone is told the name is taken.
 */
export function join(
  st: CCState,
  rawName: string,
  claim: boolean,
  newId: string,
  now: number,
): { state: CCState; result: JoinResult } {
  open(st);
  const name = rawName.trim().replace(/\s+/g, ' ').slice(0, 40);
  if (!name) throw new Error('Escribe tu nombre');
  const existing = st.players.find((p) => normName(p.name) === normName(name));
  if (existing) {
    return claim
      ? { state: st, result: { status: 'ok', token: existing.id } }
      : { state: st, result: { status: 'exists', num: existing.num } };
  }
  const num = st.players.length + 1;
  const slot: Slot =
    num <= st.slots.length
      ? st.slots[num - 1]
      : { role: st.overflow[(num - st.slots.length - 1) % st.overflow.length], decoy: null };
  const player: CCPlayer = {
    id: newId,
    num,
    name,
    role: slot.role,
    decoy: slot.decoy,
    auditor: false,
    life: LIFE.start,
    joinedAt: now,
  };
  return { state: bump({ ...st, players: [...st.players, player] }), result: { status: 'ok', token: newId } };
}

const playerOf = (st: CCState, token: string) => {
  const me = st.players.find((p) => p.id === token);
  if (!me) throw new Error('No encontramos a tu personaje');
  return me;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));
/** Changes a player's life bar, if the bars are on. */
const lifeChange = (st: CCState, id: string, delta: number): CCPlayer[] =>
  st.session.pointsOn ? st.players.map((p) => (p.id === id ? { ...p, life: clamp(p.life + delta) } : p)) : st.players;

export function vote(st: CCState, token: string, targetNum: number): CCState {
  open(st);
  const me = playerOf(st, token);
  if (!st.session.voteOpen) throw new Error('La votación está cerrada');
  const target = st.players.find((p) => p.num === targetNum);
  if (!target) throw new Error('Ese jugador no existe');
  if (target.id === me.id) throw new Error('No puedes votar por ti');
  const round = st.session.voteRound;
  if (st.votes.some((v) => v.round === round && v.voterId === me.id)) throw new Error('Ya votaste en esta ronda');
  return bump({
    ...st,
    votes: [...st.votes, { round, voterId: me.id, targetId: target.id }],
    players: lifeChange(st, target.id, LIFE.perVote),
  });
}

export function rescue(st: CCState, token: string, answer: string, id: string, now: number): CCState {
  open(st);
  const me = playerOf(st, token);
  const section = st.session.section;
  if (!RESCUE_SECTIONS.includes(section)) throw new Error('Esta sección no tiene pregunta rescate');
  const text = answer.trim().slice(0, 400);
  if (!text) throw new Error('Escribe tu respuesta');
  if (st.rescues.some((r) => r.playerId === me.id && r.section === section))
    throw new Error('Ya pediste el rescate de esta sección');
  return bump({
    ...st,
    rescues: [...st.rescues, { id, playerId: me.id, section, auditor: me.auditor, answer: text, status: 'pendiente', at: now }],
  });
}

export function markRescue(st: CCState, rescueId: string, ok: boolean): CCState {
  open(st);
  const r = st.rescues.find((x) => x.id === rescueId);
  if (!r) throw new Error('Ese rescate no existe');
  if (r.status !== 'pendiente') return st;
  const next = { ...st, rescues: st.rescues.map((x) => (x.id === rescueId ? { ...x, status: ok ? ('correcta' as const) : ('incorrecta' as const) } : x)) };
  return bump({ ...next, players: lifeChange(st, r.playerId, ok ? LIFE.rescueRight : LIFE.rescueWrong) });
}

/** Voted out does not mean out: the player becomes an auditor and keeps playing. */
export function setAuditor(st: CCState, playerId: string, on: boolean): CCState {
  open(st);
  if (!st.players.some((p) => p.id === playerId)) throw new Error('Ese jugador no existe');
  return bump({ ...st, players: st.players.map((p) => (p.id === playerId ? { ...p, auditor: on } : p)) });
}

export function sale(st: CCState, token: string, sellerNum: number, criteria: string[], convinced: boolean, id: string, now: number): CCState {
  open(st);
  const me = playerOf(st, token);
  if (!st.session.saleOpen) throw new Error('La venta no está abierta');
  if (!MERCHANT_ROLES.includes(me.role)) throw new Error('Solo un merchant decide la venta');
  const seller = st.players.find((p) => p.num === sellerNum);
  if (!seller || seller.id === me.id) throw new Error('Elige a quien te vendió');
  if (st.sales.some((s) => s.merchantId === me.id && s.sellerId === seller.id)) throw new Error('Ya calificaste a esa persona');
  const valid = criteria.filter((c) => SALE_CRITERIA.some((k) => k.id === c));
  return bump({
    ...st,
    sales: [...st.sales, { id, merchantId: me.id, sellerId: seller.id, criteria: valid, convinced, at: now }],
  });
}

/** Closing erases everyone: names, roles, votes, rescues and sales. */
export function close(st: CCState): CCState {
  return bump({ ...st, players: [], votes: [], rescues: [], sales: [], slots: [], overflow: [], session: { ...st.session, status: 'cerrada', voteOpen: false, roundOpen: false, saleOpen: false } });
}

export function playerView(st: CCState, token: string): PlayerView | null {
  const me = st.players.find((p) => p.id === token);
  if (!me) return null;
  const round = st.session.voteRound;
  const mine = st.votes.find((v) => v.round === round && v.voterId === me.id);
  return {
    session: st.session,
    me,
    roster: st.players.map((p) => ({ num: p.num, auditor: p.auditor, wasPhishing: p.auditor ? p.role === 'phishing' : null })),
    votedFor: mine ? (st.players.find((p) => p.id === mine.targetId)?.num ?? null) : null,
    rescues: st.rescues.filter((r) => r.playerId === me.id).map((r) => ({ section: r.section, auditor: r.auditor, status: r.status })),
    judged: st.sales.filter((s) => s.merchantId === me.id).map((s) => st.players.find((p) => p.id === s.sellerId)?.num ?? 0),
  };
}

export function boardView(st: CCState): BoardView {
  return {
    session: st.session,
    players: [...st.players]
      .sort((a, b) => b.life - a.life || a.num - b.num)
      .map((p) => ({ num: p.num, name: p.name, life: p.life, auditor: p.auditor, wasPhishing: p.auditor ? p.role === 'phishing' : null })),
    voted: st.votes.filter((v) => v.round === st.session.voteRound).length,
  };
}

export function hostView(st: CCState): HostView {
  return { session: st.session, players: st.players, votes: st.votes, rescues: st.rescues, sales: st.sales };
}
