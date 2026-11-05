import type { SignalId } from '../engine/signals';
import type { V2CaseConfig } from '../engine/v2/config';

/**
 * How a message lands, following the three branches of each case's flow:
 * it damages the relationship, it leaves the other person unsure, or it moves
 * the conversation forward.
 */
export type Category = 'escalate' | 'unclear' | 'effective';

export type CaseId = 'entrega' | 'urgente' | 'mejorar';

/** One piece of the agreement the case asks for (e.g. a date). */
export type Piece = {
  id: string;
  label: string;
  /** Any of these signals in a message supplies the piece. */
  from: SignalId[];
  /** What the other person says while this piece is still missing. */
  ask: string[];
};

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
   * When present, the case runs on the memory engine (`engine/v2`): the
   * colleague answers to the whole conversation. `categorize`, `pieces` and
   * `replies` are then unused.
   */
  v2?: V2CaseConfig;
  /** Decides which branch a message takes, from its signals. */
  categorize: (signals: Set<SignalId>) => Category;
  pieces: Piece[];
  /** Signals that matter for this case, for the results analysis. */
  relevant: SignalId[];
  replies: {
    /** First and later times the message escalates. */
    escalate: string[];
    /** The message is unclear, before the conversation has opened. */
    unclear: string[];
    /** The message is unclear once you are already talking it through. */
    unclearInDialog: string[];
    /** The conversation opens: the other person explains what is going on. */
    open: string[];
    /** Same, after a tense or confused start. */
    openAfterFriction: string[];
    agreement: string[];
    /** Turns ran out with no agreement. */
    noAgreement: string[];
    /** A reaction to one specific signal, used before the generic line. */
    bySignal?: Partial<Record<SignalId, string>>;
  };
  /** "Qué observar en las respuestas". */
  observe: string[];
  lessons: string[];
};
