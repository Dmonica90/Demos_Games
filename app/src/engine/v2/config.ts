import type { Character, Memory } from './types';

/** One thing the colleague can say; the id makes it never repeat. */
export type Line = { id: string; text: string };
export type Tone = { normal: Line[]; guarded: Line[] };

export type ReactionId =
  | 'hostile'
  | 'blame'
  | 'pressure'
  | 'accept'
  | 'partial'
  | 'impact'
  | 'urgency'
  | 'empathy'
  | 'request'
  | 'deadline';

/**
 * Something the conversation still has to settle, in the order the colleague
 * cares about it. While unmet the colleague asks about it, each time in a
 * different way, or, when willing, offers a way forward itself.
 */
export type Need = {
  id: string;
  met: (m: Memory) => boolean;
  ask: Line[];
  offer?: {
    when: (c: Character, m: Memory) => boolean;
    lines: Line[];
    pending: 'partial' | 'deadline' | 'confirm';
    /** Slot values the offer puts on the table ("mañana a mediodía"). */
    fills?: Memory['slots'];
  };
};

export type V2CaseConfig = {
  maxTurns: number;
  character: Character;
  needs: Need[];
  reactions: Record<ReactionId, Tone>;
  /** Defaults for template slots the participant never filled. */
  slotDefaults: Required<Memory['slots']>;
  closings: Record<'agreement' | 'last_adjustment' | 'cannot_commit' | 'deteriorated', Tone>;
};

/** Fills {deliverable}, {deadline}, {partial}, {partialWhen} and capitalises the first letter. */
export function fill(text: string, slots: Memory['slots'], defaults: Required<Memory['slots']>): string {
  const out = text.replace(
    /\{(deliverable|deadline|partial|partialWhen)\}/g,
    (_, k: keyof Memory['slots']) => slots[k] ?? defaults[k],
  );
  return out.charAt(0).toUpperCase() + out.slice(1);
}
