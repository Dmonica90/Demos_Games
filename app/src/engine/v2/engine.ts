import type { Category } from '../../cases/types';
import type { Color } from '../conversation';
import { CRITERIA, pointsDelta, quality } from '../score';
import type { CriteriaScores } from '../score';
import type { SignalId } from '../signals';
import { analyze } from './analyzer';
import { isGuarded, relationship, updateCharacter } from './character';
import { fill } from './config';
import type { Line, Need, Tone, V2CaseConfig } from './config';
import { emptyMemory, taskStage, updateMemory } from './memory';
import { scoreMessage } from './scoring';
import type { Analysis, Closing, Memory, Quadrant, V2State } from './types';

export function initialState(cfg: V2CaseConfig): V2State {
  return {
    turn: 0,
    memory: emptyMemory(cfg),
    task: 'not_started',
    character: { ...cfg.character },
    relationship: 'collaborative',
    criteriaSum: { clarity: 0, tone: 0, context: 0, assertiveness: 0, agreements: 0 },
    finished: false,
    closing: null,
  };
}

const fits = (l: Line, m: Memory) => !l.when || l.when(m);

/** First line of the pool that fits and was not said yet (else the first that fits). */
function pickLine(pool: Line[], used: string[], m: Memory): Line {
  const ok = pool.filter((l) => fits(l, m));
  const from = ok.length ? ok : pool;
  return from.find((l) => !used.includes(l.id)) ?? from[from.length - 1];
}

function pickTone(tone: Tone, guarded: boolean, used: string[], m: Memory): Line {
  return pickLine(guarded && tone.guarded.length ? tone.guarded : tone.normal, used, m);
}

/**
 * A reaction not said yet: the tone's own pool first, then the other one.
 * When every line was used, the character skips the reaction rather than
 * repeating itself.
 */
function freshReaction(tone: Tone, guarded: boolean, used: string[], m: Memory): Line | undefined {
  const first = guarded && tone.guarded.length ? tone.guarded : tone.normal;
  const second = first === tone.normal ? tone.guarded : tone.normal;
  return [...first, ...second].find((l) => !used.includes(l.id) && fits(l, m));
}

/** The first unmet need; once the plan is ready, straight to confirming it. */
export function identifyNextNeed(cfg: V2CaseConfig, m: Memory): Need | null {
  if (cfg.planReady(m.flags)) {
    const confirm = cfg.needs.find((n) => n.confirm && !n.met(m.flags));
    if (confirm) return confirm;
  }
  return cfg.needs.find((n) => !n.met(m.flags)) ?? null;
}

function escalates(cfg: V2CaseConfig, a: Analysis): string | null {
  const hit = cfg.escalating.find((e) => a.signals[e.signal] && !e.unless?.some((u) => a.signals[u]));
  return hit?.signal ?? null;
}

/** What the character reacts to: the first rule of the case that applies. */
function reactionFor(
  cfg: V2CaseConfig,
  a: Analysis,
  before: Memory,
  after: Memory,
  accepted: boolean,
): { id: string; hostile: boolean } | null {
  for (const r of cfg.reactionOrder) {
    if ('signal' in r && a.signals[r.signal] && !r.unless?.some((u) => a.signals[u])) {
      return { id: r.reaction, hostile: cfg.escalating.some((e) => e.signal === r.signal) };
    }
    if ('accepted' in r && accepted) return { id: r.reaction, hostile: false };
    if ('newFlag' in r && after.flags[r.newFlag] && !before.flags[r.newFlag]) return { id: r.reaction, hostile: false };
  }
  return null;
}

function nextColor(prev: Color, category: Category, rel: V2State['relationship'], points: number): Color {
  let c: Color = 'green';
  if (category === 'unclear' || rel === 'tense') c = 'yellow';
  if (category === 'escalate') c = prev === 'green' ? 'yellow' : 'red';
  if (rel === 'deteriorated' || points < 55) c = 'red';
  const rank = { green: 0, yellow: 1, red: 2 } as const;
  return rank[c] >= rank[prev] ? c : prev;
}

export type V2Step = {
  state: V2State;
  reply: string;
  category: Category;
  signals: SignalId[];
  scores: CriteriaScores;
  quality: number;
  delta: number;
  color: Color;
  points: number;
  done: boolean;
  mission: boolean;
};

/**
 * One turn: analyse → remember → update the problem and the character →
 * decide what is still missing → answer without repeating → score.
 */
export function processParticipantMessage(
  cfg: V2CaseConfig,
  state: V2State,
  text: string,
  prev: { points: number; color: Color },
): V2Step {
  const a = analyze(text, cfg.families, cfg.concrete);
  const s = a.signals;
  for (const rule of cfg.suppress ?? []) if (rule.when.some((w) => s[w])) delete s[rule.signal];
  const escalation = escalates(cfg, a);

  // 1–2. Memory, and a "yes" to the offer on the table.
  const before = state.memory;
  let memory = updateMemory(cfg, before, a, Boolean(escalation));
  let accepted = false;
  // Only a yes accepts ("gracias" alone is politeness, not a commitment).
  if (before.pending_offer && !escalation && (s.affirm || s.agreement)) {
    const offer =
      cfg.needs.find((n) => n.offer?.id === before.pending_offer)?.offer ??
      cfg.needs.find((n) => n.confirm?.id === before.pending_offer)?.confirm;
    if (offer) {
      accepted = true;
      memory = { ...memory, flags: { ...memory.flags, ...Object.fromEntries(offer.sets.map((f) => [f, true])) } };
    }
  }
  if (accepted) {
    // A short "sí" to an offer is a complete answer, not a vague one.
    delete s.short;
    delete s.vague;
  }

  // 3–5. Problem, character, relationship.
  const wasReady = cfg.planReady(before.flags);
  const character = updateCharacter(cfg, state.character, a, cfg.planReady(memory.flags) && !wasReady);
  const rel = relationship(character);
  const guarded = isGuarded(character);
  const turn = state.turn + 1;

  // A ready plan closes when the participant settles it, or on the last turn,
  // if the character is still willing.
  const willing = rel !== 'deteriorated' && character.willingness >= 55 && !escalation;
  if (
    !memory.flags[cfg.agreementFlag] &&
    cfg.planReady(memory.flags) &&
    willing &&
    (cfg.closers.some((c) => s[c]) || turn >= cfg.maxTurns)
  ) {
    memory = { ...memory, flags: { ...memory.flags, [cfg.agreementFlag]: true } };
  }
  const task = taskStage(cfg, memory.flags, state.task);

  // 6–7. What to say: a reaction to what is new, then the next step.
  const used = [...memory.used_responses];
  const said: Line[] = [];
  let pending: string | null = null;
  let closing: Closing | null = null;
  const reaction = reactionFor(cfg, a, before, memory, accepted);

  if (memory.flags[cfg.agreementFlag]) {
    closing = 'agreement';
    said.push(pickTone(cfg.closings.agreement, guarded || rel !== 'collaborative', used, memory));
  } else if (rel === 'deteriorated') {
    closing = turn >= cfg.maxTurns || character.defensiveness >= 85 ? 'deteriorated' : null;
    const line = closing
      ? pickTone(cfg.closings.deteriorated, true, used, memory)
      : freshReaction(cfg.reactions[reaction?.hostile ? reaction.id : cfg.brokenReaction], true, used, memory) ??
        // Nothing new left to say while upset: end the conversation.
        ((closing = 'deteriorated'), pickTone(cfg.closings.deteriorated, true, used, memory));
    said.push(line);
  } else if (turn >= cfg.maxTurns) {
    const r = reaction && freshReaction(cfg.reactions[reaction.id], guarded, used, memory);
    if (r) said.push(r);
    closing = cfg.lastClosing(memory.flags);
    said.push(pickTone(cfg.closings[closing], guarded, used, memory));
  } else {
    const r = reaction && freshReaction(cfg.reactions[reaction.id], guarded, used, memory);
    if (r) said.push(r);
    // A long message the rules could not read is still acknowledged, never ignored.
    else if (!reaction && a.words >= 8 && !s.vague && !escalation) {
      const ack = cfg.acknowledge.find((l) => !used.includes(l.id));
      if (ack) said.push(ack);
    }
    const hostile = Boolean(reaction?.hostile);
    const quiet = reaction ? cfg.quietReactions?.includes(reaction.id) : false;
    const need = quiet ? null : identifyNextNeed(cfg, memory);
    if (need && !(hostile && guarded)) {
      const count = memory.ask_count[need.id] ?? 0;
      const offer = need.offer && !hostile && need.offer.when(character, memory.flags) ? need.offer : null;
      if (offer && !offer.lines.every((l) => used.includes(l.id))) {
        said.push(pickLine(offer.lines, used, memory));
        pending = offer.id;
        if (offer.fills) memory = { ...memory, slots: { ...offer.fills, ...memory.slots } };
      } else {
        // Ask again only in a way not used yet; otherwise say something else.
        const ask = [need.ask[count], ...need.ask].find((l) => l && !used.includes(l.id) && fits(l, memory));
        // Out of new ways to ask: if the character already reacted, that is enough.
        const line = ask ?? (reaction ? undefined : cfg.stall.find((l) => !used.includes(l.id)));
        if (line) said.push(line);
        if (need.confirm && ask) pending = need.confirm.id;
      }
      memory = {
        ...memory,
        asked_topics: memory.asked_topics.includes(need.id) ? memory.asked_topics : [...memory.asked_topics, need.id],
        ask_count: { ...memory.ask_count, [need.id]: count + 1 },
      };
    }
  }

  const reply = said.map((l) => fill(l.text, memory.slots, cfg.slotDefaults)).join(' ');
  memory = { ...memory, used_responses: [...used, ...said.map((l) => l.id)], pending_offer: pending };

  // 9. Score.
  const category: Category =
    escalation || s.shouting
      ? 'escalate'
      : accepted
        ? 'effective'
        : s.vague || cfg.unclear?.some((u) => s[u])
          ? 'unclear'
          : 'effective';
  const scores = scoreMessage(a, cfg.aliases);
  const q = quality(scores);
  const delta = accepted ? Math.max(0, pointsDelta(q, category)) : pointsDelta(q, category);
  const points = Math.max(0, Math.min(100, prev.points + delta));
  const color = nextColor(prev.color, category, rel, points);
  const criteriaSum = { ...state.criteriaSum };
  for (const c of CRITERIA) criteriaSum[c.id] += scores[c.id];

  // 10. Finished?
  const done = closing !== null;
  return {
    state: { turn, memory, task, character, relationship: rel, criteriaSum, finished: done, closing },
    reply,
    category,
    signals: Object.keys(s).filter((k) => s[k] > 0) as SignalId[],
    scores,
    quality: q,
    delta,
    color,
    points,
    done,
    mission: memory.flags[cfg.agreementFlag],
  };
}

export const QUADRANT_LABEL: Record<Quadrant, { title: string; text: string }> = {
  effective: { title: 'Misión resuelta eficazmente', text: 'Comunicaste bien y conseguiste un acuerdo concreto.' },
  good_no_deal: { title: 'Buena comunicación, sin concretar', text: 'Cuidaste la relación, pero faltó cerrar qué, cuándo y quién.' },
  deal_with_friction: { title: 'Resultado con fricción', text: 'Conseguiste el acuerdo, pero la conversación generó tensión.' },
  deteriorated: { title: 'La conversación se deterioró', text: 'No se resolvió el problema y la relación quedó afectada.' },
};

export function quadrant(points: number, color: Color, mission: boolean): Quadrant {
  const good = points >= 60 && color !== 'red';
  if (mission) return good ? 'effective' : 'deal_with_friction';
  return good ? 'good_no_deal' : 'deteriorated';
}
