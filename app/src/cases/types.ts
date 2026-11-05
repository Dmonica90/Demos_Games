import type { SignalId } from '../engine/signals';
import type { V2CaseConfig } from '../engine/v2/config';

/**
 * How a message lands: it damages the relationship, it leaves the other
 * person unsure, or it moves the conversation forward.
 */
export type Category = 'escalate' | 'unclear' | 'effective';

export type CaseId = 'entrega' | 'urgente' | 'mejorar';

export type CaseDef = {
  id: CaseId;
  number: 1 | 2 | 3;
  title: string;
  relation: string;
  context: string;
  goal: string;
  /** Who you are talking to, as the chat header shows it. */
  partner: { name: string; role: string; initials: string };
  opening: string;
  maxTurns: number;
  durationS: number;
  /**
   * The case on the memory engine (`engine/v2`): its signals, what the
   * character remembers, how its mood moves and everything it can say.
   */
  v2: V2CaseConfig;
  /** Signals that matter for this case, for the results analysis. */
  relevant: SignalId[];
  /** "Qué observar en las respuestas". */
  observe: string[];
  lessons: string[];
};
