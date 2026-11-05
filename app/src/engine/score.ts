import type { Category } from '../cases/types';
import type { SignalId } from './signals';

export type CriterionId = 'clarity' | 'tone' | 'context' | 'assertiveness' | 'agreements';

export const CRITERIA: { id: CriterionId; label: string; weight: number; tip: string }[] = [
  {
    id: 'clarity',
    label: 'Claridad y estructura',
    weight: 25,
    tip: 'Di qué necesitas en una o dos frases completas, sin rodeos ni mensajes de una palabra.',
  },
  {
    id: 'tone',
    label: 'Empatía y tono',
    weight: 25,
    tip: 'Reconoce la situación de la otra persona antes de pedir algo; evita culpar, presionar o etiquetar.',
  },
  {
    id: 'context',
    label: 'Contexto e intención',
    weight: 20,
    tip: 'Explica el porqué: qué depende de esto y qué impacto tiene.',
  },
  {
    id: 'assertiveness',
    label: 'Asertividad',
    weight: 15,
    tip: 'Expresa tu necesidad con firmeza y respeto, sin ceder todo ni imponer.',
  },
  {
    id: 'agreements',
    label: 'Acuerdos y siguientes pasos',
    weight: 15,
    tip: 'Cierra con algo concreto: qué, quién y para cuándo.',
  },
];

export type CriteriaScores = Record<CriterionId, number>;

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Each criterion from 0 to 1 for one message. */
export function criteria(s: Set<SignalId>, category: Category): CriteriaScores {
  const has = (id: SignalId) => s.has(id);
  const harsh = has('hostile') || has('label');

  let clarity = 0.45;
  if (has('context') || has('capacity') || has('facts')) clarity += 0.25;
  if (has('proposal') || has('assertive') || has('priority')) clarity += 0.2;
  if (has('concrete')) clarity += 0.1;
  if (has('vague')) clarity -= 0.3;
  if (has('short')) clarity -= 0.35;
  if (has('shouting')) clarity -= 0.2;

  let tone = 0.55;
  if (has('empathy')) tone += 0.3;
  if (has('listen') || has('question')) tone += 0.15;
  if (has('support')) tone += 0.1;
  if (has('blame')) tone -= 0.5;
  if (has('pressure')) tone -= 0.3;
  if (has('shouting')) tone -= 0.3;
  if (harsh) tone -= 0.7;

  let context = 0.25;
  if (has('context')) context += 0.55;
  if (has('capacity') || has('facts')) context += 0.4;
  if (has('assertive')) context += 0.1;

  let assertiveness = 0.4;
  if (has('assertive')) assertiveness += 0.35;
  if (has('proposal') || has('priority')) assertiveness += 0.25;
  if (has('concrete')) assertiveness += 0.1;
  if (has('blindAccept') || has('avoid') || has('vague')) assertiveness -= 0.35;
  if (has('pressure') || has('reject')) assertiveness -= 0.3;
  if (harsh || has('blame')) assertiveness -= 0.3;

  let agreements = 0.1;
  if (has('proposal') || has('priority') || has('support')) agreements += 0.35;
  if (has('concrete')) agreements += 0.35;
  if (has('commitment') || has('followup')) agreements += 0.3;
  if (has('question')) agreements += 0.1;

  const scores: CriteriaScores = {
    clarity: clamp(clarity),
    tone: clamp(tone),
    context: clamp(context),
    assertiveness: clamp(assertiveness),
    agreements: clamp(agreements),
  };
  // A message that blows up the conversation cannot score well overall.
  if (category === 'escalate') for (const k of Object.keys(scores) as CriterionId[]) scores[k] *= 0.6;
  return scores;
}

/** The weighted total, 0–100. */
export function quality(scores: CriteriaScores): number {
  return Math.round(CRITERIA.reduce((sum, c) => sum + scores[c.id] * c.weight, 0));
}

/** How a message moves the 100-point communication bar. */
export function pointsDelta(q: number, category: Category): number {
  let delta: number;
  if (q >= 75) delta = 2;
  else if (q >= 60) delta = 0;
  else if (q >= 45) delta = -6;
  else delta = -12;
  if (category === 'escalate') delta -= 12;
  if (category === 'unclear') delta -= 4;
  return delta;
}
