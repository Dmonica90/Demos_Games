import type { Category } from '../cases/types';

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
