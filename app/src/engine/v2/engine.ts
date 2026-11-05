import type { Category } from '../../cases/types';
import type { Color } from '../conversation';
import { CRITERIA, pointsDelta, quality } from '../score';
import type { CriteriaScores } from '../score';
import type { SignalId } from '../signals';
import { analyze } from './analyzer';
import { isGuarded, relationship, updateCharacter } from './character';
import { fill } from './config';
import type { Line, Need, ReactionId, Tone, V2CaseConfig } from './config';
import { emptyMemory, taskStatus, updateMemory } from './memory';
import { scoreMessage } from './scoring';
import type { Analysis, Memory, Quadrant, V2State } from './types';

export function initialState(cfg: V2CaseConfig): V2State {
  return {
    turn: 0,
    memory: emptyMemory(),
    task: 'not_started',
    character: { ...cfg.character },
    relationship: 'collaborative',
    criteriaSum: { clarity: 0, tone: 0, context: 0, assertiveness: 0, agreements: 0 },
    finished: false,
    closing: null,
  };
}

/** First line of the pool not said yet (or the last one, if all were used). */
function pickLine(pool: Line[], used: string[]): Line {
  return pool.find((l) => !used.includes(l.id)) ?? pool[pool.length - 1];
}

function pickTone(tone: Tone, guarded: boolean, used: string[]): Line {
  return pickLine(guarded && tone.guarded.length ? tone.guarded : tone.normal, used);
}

/** What the colleague reacts to: the strongest thing that is new this turn. */
function reactionFor(a: Analysis, before: Memory, after: Memory, accepted: boolean): ReactionId | null {
  const s = a.signals;
  if (s.hostile) return 'hostile';
  if (s.blame) return 'blame';
  if (s.pressure && !s.empathy) return 'pressure';
  if (accepted) return 'accept';
  if (after.partial_delivery_proposed && !before.partial_delivery_proposed) return 'partial';
  if (after.impact_explained && !before.impact_explained) return 'impact';
  if (after.empathy_shown && !before.empathy_shown) return 'empathy';
  if (after.urgency_explained && !before.urgency_explained) return 'urgency';
  if (after.request_clarity && !before.request_clarity) return 'request';
  if (after.deadline_defined && !before.deadline_defined) return 'deadline';
  return null;
}

/** The first unmet need. Already-asked needs are asked again only in a new way. */
export function identifyNextNeed(cfg: V2CaseConfig, m: Memory): Need | null {
  return cfg.needs.find((n) => !n.met(m)) ?? null;
}

function categorize(a: Analysis, accepted: boolean): Category {
  const s = a.signals;
  if (s.hostile || s.blame || s.shouting || (s.pressure && !s.empathy)) return 'escalate';
  if (accepted) return 'effective';
  if (s.vague) return 'unclear';
  return 'effective';
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
 * One turn: analyse → remember → update the problem and the colleague →
 * decide what is still missing → answer without repeating → score.
 */
export function processParticipantMessage(
  cfg: V2CaseConfig,
  state: V2State,
  text: string,
  prev: { points: number; color: Color },
): V2Step {
  const a = analyze(text);
  const s = a.signals;
  const escalation = Boolean(s.hostile || s.blame || (s.pressure && !s.empathy));

  // 1–2. Memory.
  const before = state.memory;
  let memory = updateMemory(before, a, Boolean(s.hostile));
  const accepted =
    before.pending_offer !== null &&
    !escalation &&
    ((before.pending_offer === 'partial' && memory.partial_delivery_proposed && !before.partial_delivery_proposed) ||
      (before.pending_offer === 'deadline' && memory.deadline_defined && !before.deadline_defined) ||
      (before.pending_offer === 'confirm' && memory.agreement_reached));
  if (accepted) {
    // A short "sí" to an offer is a complete answer, not a vague one.
    delete s.short;
    delete s.vague;
  }

  // 3–5. Problem, colleague, relationship.
  const planTookShape =
    memory.deadline_defined && memory.partial_delivery_proposed && !(before.deadline_defined && before.partial_delivery_proposed);
  const character = updateCharacter(state.character, a, planTookShape);
  const rel = relationship(character);
  const guarded = isGuarded(character);
  const turn = state.turn + 1;

  // A complete plan the participant asks to confirm, or settles on the last
  // turn, is accepted by a colleague who is still willing.
  const planReady = memory.deadline_defined && (memory.partial_delivery_proposed || memory.request_clarity);
  const willing = rel !== 'deteriorated' && character.willingness >= 55 && !escalation;
  // Only an explicit "quedamos / ¿te parece bien?" closes early; otherwise the
  // colleague first sums up the plan and asks to confirm it.
  if (!memory.agreement_reached && planReady && willing && (s.agreement || turn >= cfg.maxTurns)) {
    memory = { ...memory, agreement_reached: true, responsibility_confirmed: true };
  }
  const task = taskStatus(memory, state.task);

  // 6–7. What to say.
  const used = [...memory.used_responses];
  const said: Line[] = [];
  let pending: Memory['pending_offer'] = null;
  let closing: V2State['closing'] = null;

  const reaction = reactionFor(a, before, memory, accepted);

  if (memory.agreement_reached) {
    closing = 'agreement';
    said.push(pickTone(cfg.closings.agreement, guarded || rel !== 'collaborative', used));
  } else if (rel === 'deteriorated') {
    closing = turn >= cfg.maxTurns || character.defensiveness >= 85 ? 'deteriorated' : null;
    said.push(
      closing
        ? pickTone(cfg.closings.deteriorated, true, used)
        : pickTone(cfg.reactions[reaction && ['hostile', 'blame', 'pressure'].includes(reaction) ? reaction : 'blame'], true, used),
    );
  } else if (turn >= cfg.maxTurns) {
    if (reaction) said.push(pickTone(cfg.reactions[reaction], guarded, used));
    closing = memory.deadline_defined || memory.partial_delivery_proposed ? 'last_adjustment' : 'cannot_commit';
    said.push(pickTone(cfg.closings[closing], guarded, used));
  } else {
    if (reaction) said.push(pickTone(cfg.reactions[reaction], guarded, used));
    const escalated = reaction === 'hostile' || reaction === 'blame' || reaction === 'pressure';
    const need = identifyNextNeed(cfg, memory);
    if (need && !(escalated && guarded)) {
      const count = memory.ask_count[need.id] ?? 0;
      const offer = need.offer && !escalated && need.offer.when(character, memory) ? need.offer : null;
      if (offer && !offer.lines.every((l) => used.includes(l.id))) {
        said.push(pickLine(offer.lines, used));
        pending = offer.pending;
        if (offer.fills) memory = { ...memory, slots: { ...offer.fills, ...memory.slots } };
      } else {
        said.push(need.ask[Math.min(count, need.ask.length - 1)]);
        if (need.id === 'confirm') pending = 'confirm';
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
  const category = categorize(a, accepted);
  const scores = scoreMessage(a);
  const q = quality(scores);
  // Saying yes to a good offer never costs points.
  const delta = accepted ? Math.max(0, pointsDelta(q, category)) : pointsDelta(q, category);
  const points = Math.max(0, Math.min(100, prev.points + delta));
  const color = nextColor(prev.color, category, rel, points);
  const criteriaSum = { ...state.criteriaSum };
  for (const c of CRITERIA) criteriaSum[c.id] += scores[c.id];

  // 10. Finished?
  const done = closing !== null;
  return {
    state: {
      turn,
      memory,
      task,
      character,
      relationship: rel,
      criteriaSum,
      finished: done,
      closing,
    },
    reply,
    category,
    signals: Object.keys(s).filter((k) => (s as Record<string, number>)[k] > 0) as SignalId[],
    scores,
    quality: q,
    delta,
    color,
    points,
    done,
    mission: memory.agreement_reached,
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
