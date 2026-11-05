import type { CaseDef, Category } from '../cases/types';
import { initialState, processParticipantMessage, quadrant } from './v2/engine';
import type { Quadrant, V2State } from './v2/types';
import { CRITERIA, criteria, pointsDelta, quality } from './score';
import type { CriteriaScores, CriterionId } from './score';
import { detect } from './signals';
import type { SignalId } from './signals';

/**
 * One participant's conversation, as a pure function of what they typed. Every
 * phone runs this same code on the same case, so everyone plays by the same
 * rules; the host only reads the results.
 */

export type Color = 'green' | 'yellow' | 'red';
export type Stage = 'opening' | 'defensive' | 'confused' | 'dialog' | 'closed';
export type EndReason = 'agreement' | 'turns' | 'time';

export type Message =
  | { from: 'partner'; text: string; at: number }
  | {
      from: 'me';
      text: string;
      at: number;
      category: Category;
      signals: SignalId[];
      quality: number;
      delta: number;
      /** v2 only: the five criteria for this message. */
      scores?: CriteriaScores;
    };

export type Conversation = {
  stage: Stage;
  turn: number;
  points: number;
  color: Color;
  escalations: number;
  /** Agreement pieces supplied so far, by id. */
  pieces: string[];
  messages: Message[];
  done: boolean;
  mission: boolean;
  endReason: EndReason | null;
  startedAt: number;
  finishedAt: number | null;
  /** v2 only: memory, task, character and running scores. */
  v2?: V2State;
  /** v2 only: communication × mission, once finished. */
  quadrant?: Quadrant;
};

export const START_POINTS = 100;
/** Below this the bar turns red regardless of the last message. */
export const RED_LINE = 55;

export function start(def: CaseDef, now: number): Conversation {
  return {
    stage: 'opening',
    turn: 0,
    points: START_POINTS,
    color: 'green',
    escalations: 0,
    pieces: [],
    messages: [{ from: 'partner', text: def.opening, at: now }],
    done: false,
    mission: false,
    endReason: null,
    startedAt: now,
    finishedAt: null,
    ...(def.v2 ? { v2: initialState(def.v2) } : {}),
  };
}

function replyV2(def: CaseDef, convo: Conversation, text: string, now: number): Conversation {
  const cfg = def.v2!;
  const r = processParticipantMessage(cfg, convo.v2 ?? initialState(cfg), text, {
    points: convo.points,
    color: convo.color,
  });
  const mine: Message = {
    from: 'me',
    text: text.trim(),
    at: now,
    category: r.category,
    signals: r.signals,
    quality: r.quality,
    delta: r.delta,
    scores: r.scores,
  };
  return {
    ...convo,
    stage: r.done ? 'closed' : r.state.relationship === 'collaborative' ? 'dialog' : 'defensive',
    turn: r.state.turn,
    points: r.points,
    color: r.color,
    escalations: convo.escalations + (r.category === 'escalate' ? 1 : 0),
    pieces: [],
    messages: [...convo.messages, mine, { from: 'partner', text: r.reply, at: now }],
    done: r.done,
    mission: r.mission,
    endReason: r.done ? (r.mission ? 'agreement' : 'turns') : null,
    finishedAt: r.done ? now : null,
    v2: r.state,
    quadrant: r.done ? quadrant(r.points, r.color, r.mission) : undefined,
  };
}

/** Picks a line deterministically, so the same conversation always reads the same. */
const pick = (lines: string[], index: number) => lines[Math.min(index, lines.length - 1)];

function nextColor(color: Color, category: Category, points: number): Color {
  let next = color;
  if (category === 'escalate') next = color === 'green' ? 'yellow' : 'red';
  else if (category === 'unclear' && color === 'green') next = 'yellow';
  if (points < RED_LINE) next = 'red';
  // The bar never climbs back: once green is lost it stays lost.
  const rank = { green: 0, yellow: 1, red: 2 } as const;
  return rank[next] >= rank[color] ? next : color;
}

export function analyze(def: CaseDef, text: string) {
  const signals = detect(text);
  const category = def.categorize(signals);
  const scores = criteria(signals, category);
  const q = quality(scores);
  return { signals, category, scores, quality: q, delta: pointsDelta(q, category) };
}

/** The participant sends a message; the other person answers. */
export function reply(def: CaseDef, convo: Conversation, text: string, now: number): Conversation {
  if (convo.done || !text.trim()) return convo;
  if (def.v2) return replyV2(def, convo, text, now);
  const a = analyze(def, text);
  const turn = convo.turn + 1;
  const points = Math.max(0, Math.min(START_POINTS, convo.points + a.delta));
  const color = nextColor(convo.color, a.category, points);

  const pieces = new Set(convo.pieces);
  if (a.category !== 'escalate') {
    for (const piece of def.pieces) if (piece.from.some((s) => a.signals.has(s))) pieces.add(piece.id);
  }
  const missing = def.pieces.find((p) => !pieces.has(p.id));

  const mine: Message = {
    from: 'me',
    text: text.trim(),
    at: now,
    category: a.category,
    signals: [...a.signals],
    quality: a.quality,
    delta: a.delta,
  };

  let stage: Stage = convo.stage;
  let escalations = convo.escalations;
  let answer: string;
  let done = false;
  let mission = false;
  let endReason: EndReason | null = null;

  const previous = [...convo.messages].reverse().find((m) => m.from === 'partner')?.text;
  const special =
    a.category === 'effective'
      ? undefined
      : Object.entries(def.replies.bySignal ?? {}).find(
          ([signal, line]) => a.signals.has(signal as SignalId) && line !== previous,
        )?.[1];

  if (special) {
    if (a.category === 'escalate') escalations += 1;
    if (stage !== 'dialog' || a.category === 'escalate') stage = a.category === 'escalate' ? 'defensive' : 'confused';
    answer = special;
  } else if (a.category === 'escalate') {
    stage = 'defensive';
    answer = pick(def.replies.escalate, escalations);
    escalations += 1;
  } else if (a.category === 'unclear') {
    if (stage === 'dialog') answer = pick(def.replies.unclearInDialog, turn % def.replies.unclearInDialog.length);
    else {
      stage = 'confused';
      answer = pick(def.replies.unclear, turn % def.replies.unclear.length);
    }
  } else if (!missing) {
    stage = 'closed';
    answer = pick(def.replies.agreement, color === 'green' ? 0 : 1);
    done = true;
    mission = true;
    endReason = 'agreement';
  } else if (stage !== 'dialog') {
    const lines = stage === 'opening' ? def.replies.open : def.replies.openAfterFriction;
    stage = 'dialog';
    answer = pick(lines, 0);
  } else {
    answer = pick(missing.ask, turn % missing.ask.length);
  }

  if (!done && turn >= def.maxTurns) {
    stage = 'closed';
    answer = pick(def.replies.noAgreement, 0);
    done = true;
    endReason = 'turns';
  }

  return {
    ...convo,
    stage,
    turn,
    points,
    color,
    escalations,
    pieces: [...pieces],
    messages: [...convo.messages, mine, { from: 'partner', text: answer, at: now }],
    done,
    mission,
    endReason,
    finishedAt: done ? now : null,
  };
}

/** True when the participant never sent a message. */
export const isSilent = (convo: Conversation) => !convo.messages.some((m) => m.from === 'me');

/**
 * Time ran out (or the host ended the activity) before an agreement. Whoever
 * never answered goes straight to red with 0 points: not writing is not a way
 * to keep the 100.
 */
export function timeUp(convo: Conversation, now: number): Conversation {
  if (convo.done) return convo;
  const silent = isSilent(convo);
  const points = silent ? 0 : convo.points;
  const color: Color = silent ? 'red' : convo.color;
  return {
    ...convo,
    stage: 'closed',
    done: true,
    endReason: 'time',
    finishedAt: now,
    points,
    color,
    ...(convo.v2 ? { quadrant: quadrant(points, color, convo.mission) } : {}),
  };
}

/** Average of each criterion over the participant's messages, 0–100. */
export function criteriaAverages(def: CaseDef, convo: Conversation): CriteriaScores {
  const mine = convo.messages.filter((m) => m.from === 'me');
  const totals: CriteriaScores = { clarity: 0, tone: 0, context: 0, assertiveness: 0, agreements: 0 };
  if (mine.length === 0) return totals;
  for (const m of mine) {
    const s = m.scores ?? analyze(def, m.text).scores;
    for (const c of CRITERIA) totals[c.id] += s[c.id];
  }
  for (const id of Object.keys(totals) as CriterionId[]) totals[id] = Math.round((totals[id] / mine.length) * 100);
  return totals;
}

/**
 * The ranking score: communication quality and solving the situation both
 * count, so keeping 100 points without an agreement does not win.
 */
export function finalScore(convo: Conversation): number {
  return Math.round(convo.points * 0.7 + (convo.mission ? 30 : 0));
}
