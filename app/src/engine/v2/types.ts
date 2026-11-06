import type { CriteriaScores } from '../score';

/**
 * The memory-driven engine ("v2"). Five independent parts, so the analyzer can
 * later be swapped for an API without touching the rest:
 *   analyzer → memory → state (task + communication) → character → evaluator.
 * Everything specific to a case (its signals, what the character remembers,
 * how its mood moves, what it says) lives in that case's config.
 */

/** A signal id: the common ones below plus any a case adds. */
export type V2Signal = string;

export type Analysis = {
  /** Signal → strength (0.5 = partial, 1 = clear). */
  signals: Record<V2Signal, number>;
  /** "los datos de ventas", as the participant wrote it. */
  deliverable?: string;
  /** "mañana a las 11", as the participant wrote it. */
  deadline?: string;
  /** A partial delivery, in the character's voice ("lo que ya tengo validado"). */
  partial?: string;
  /** When two times are given, the first is for the partial delivery ("hoy"). */
  partialWhen?: string;
  /** Every time expression, in order. */
  times: string[];
  words: number;
};

export type Slots = { deliverable?: string; deadline?: string; partial?: string; partialWhen?: string };

export type Memory = {
  /** What the character has understood so far; flags only ever turn on. */
  flags: Record<string, boolean>;
  /** Needs the character already asked about, in order. */
  asked_topics: string[];
  /** How many times each need has been asked. */
  ask_count: Record<string, number>;
  /** Ids of every line the character already said. */
  used_responses: string[];
  /** The offer on the table, waiting for a yes (its id). */
  pending_offer: string | null;
  slots: Slots;
};

export type Character = {
  stress: number;
  trust: number;
  defensiveness: number;
  willingness: number;
};

export type RelationshipState = 'collaborative' | 'tense' | 'deteriorated';

export type Quadrant = 'effective' | 'good_no_deal' | 'deal_with_friction' | 'deteriorated';

/** How the talk ended: 'agreement', 'deteriorated', or one of the case's own endings. */
export type Closing = string;

export type V2State = {
  turn: number;
  memory: Memory;
  /** Furthest stage of the task reached (from the case's `stages`). */
  task: string;
  character: Character;
  relationship: RelationshipState;
  criteriaSum: CriteriaScores;
  finished: boolean;
  closing: Closing | null;
};
