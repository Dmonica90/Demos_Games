import type { CriteriaScores } from '../score';

/**
 * The memory-driven engine ("v2"). Five independent parts, so the analyzer can
 * later be swapped for an API without touching the rest:
 *   analyzer → memory → state (task + communication) → character → evaluator.
 */

/** What a message does, detected by rules (strength 0.5 = partial, 1 = clear). */
export type V2Signal =
  | 'empathy'
  | 'gratitude'
  | 'urgency'
  | 'impact'
  | 'request'
  | 'partial'
  | 'deadline'
  | 'agreement'
  | 'responsibility'
  | 'affirm'
  | 'question'
  | 'pressure'
  | 'blame'
  | 'hostile'
  | 'shouting'
  | 'vague'
  | 'short';

export type Analysis = {
  signals: Partial<Record<V2Signal, number>>;
  /** "los datos de ventas", as the participant wrote it. */
  deliverable?: string;
  /** "mañana a las 11", as the participant wrote it. */
  deadline?: string;
  /** Normalised description of a partial delivery, in the colleague's voice ("lo que ya tengo validado"). */
  partial?: string;
  /** When two times are given, the first is for the partial delivery ("hoy", "antes de las 4"). */
  partialWhen?: string;
  words: number;
};

export type Memory = {
  urgency_explained: boolean;
  impact_explained: boolean;
  empathy_shown: boolean;
  request_clarity: boolean;
  partial_delivery_proposed: boolean;
  deadline_defined: boolean;
  responsibility_confirmed: boolean;
  agreement_reached: boolean;
  /** Needs the character already asked about, in order (never asked twice the same way). */
  asked_topics: string[];
  /** How many times each topic has been asked. */
  ask_count: Record<string, number>;
  /** Ids of every line the character already said. */
  used_responses: string[];
  /** What the character offered last turn, waiting for a yes. */
  pending_offer: 'partial' | 'deadline' | 'confirm' | null;
  slots: { deliverable?: string; deadline?: string; partial?: string; partialWhen?: string };
};

export type TaskStatus = 'not_started' | 'need_clarified' | 'partial_offer' | 'timeline_proposed' | 'agreement';

export type Character = {
  stress: number;
  trust: number;
  defensiveness: number;
  willingness: number;
};

export type RelationshipState = 'collaborative' | 'tense' | 'deteriorated';

export type Quadrant = 'effective' | 'good_no_deal' | 'deal_with_friction' | 'deteriorated';

export type V2State = {
  turn: number;
  memory: Memory;
  task: TaskStatus;
  character: Character;
  relationship: RelationshipState;
  /** Running criteria totals, to average at the end. */
  criteriaSum: CriteriaScores;
  finished: boolean;
  closing: 'agreement' | 'last_adjustment' | 'cannot_commit' | 'deteriorated' | null;
};
