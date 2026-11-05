import type { Character, Closing, Slots } from './types';

/** One thing the character can say; the id makes it never repeat. */
export type Line = { id: string; text: string };
export type Tone = { normal: Line[]; guarded: Line[] };

export type Family = { patterns: RegExp; negatable: boolean };

/** A fact the character remembers, switched on by any of these signals. */
export type FlagDef = {
  id: string;
  label: string;
  from: string[];
  /** Strength the signal needs (default 0.5). */
  minStrength?: number;
  /** Not credited while the same message attacks (empathy said with an insult). */
  needsGoodwill?: boolean;
  /** Not set when any of these signals is also present. */
  unless?: string[];
};

export type Flags = Record<string, boolean>;

export type Need = {
  id: string;
  met: (f: Flags) => boolean;
  ask: Line[];
  /** The character proposes a way forward itself when willing. */
  offer?: {
    id: string;
    when: (c: Character, f: Flags) => boolean;
    lines: Line[];
    /** Flags a "yes" switches on. */
    sets: string[];
    /** Slot values the offer puts on the table ("mañana a mediodía"). */
    fills?: Slots;
  };
  /** Asking this need is itself an offer to confirm (the summary at the end). */
  confirm?: { id: string; sets: string[] };
};

/** What the character reacts to, in priority order; the first that applies wins. */
export type ReactionRule =
  | { reaction: string; signal: string; unless?: string[] }
  | { reaction: string; newFlag: string }
  | { reaction: string; accepted: true };

export type MoodRule = {
  signal: string;
  minStrength?: number;
  unless?: string[];
  delta: Partial<Character>;
};

export type V2CaseConfig = {
  maxTurns: number;
  character: Character;
  /** Signals only this case looks for. */
  families?: Record<string, Family>;
  /** Drop a signal when any of these is also present ("con gusto" with your load explained is not a blind yes). */
  suppress?: { signal: string; when: string[] }[];
  /** Reactions after which the character says nothing more that turn (a happy "¡perfecto!"). */
  quietReactions?: string[];
  /** Said when a need was already asked every way, instead of repeating. */
  stall: Line[];
  /** Signals that give a message substance (so it is not "vague"). */
  concrete: { signal: string; minStrength?: number }[];
  /** For scoring: a case signal counts as one of the common ones. */
  aliases?: Record<string, string>;
  flags: FlagDef[];
  /** The task's stages, in order, each reached when its flag is on. */
  stages: { id: string; flag: string }[];
  needs: Need[];
  reactionOrder: ReactionRule[];
  reactions: Record<string, Tone>;
  /** Signals that damage the conversation. */
  escalating: { signal: string; unless?: string[] }[];
  /** Signals that leave the other person unsure (besides "vague"). */
  unclear?: string[];
  moodRules: MoodRule[];
  /** Signals whose mood change ignores the per-turn cap (insults). */
  uncapped?: string[];
  /** The reaction used while the relationship is broken and nothing else applies. */
  brokenReaction: string;
  /** Enough is settled for an agreement. */
  planReady: (f: Flags) => boolean;
  /** Signals that close the deal when the plan is ready ("quedamos"). */
  closers: string[];
  /** The flag that means "agreement". */
  agreementFlag: string;
  /** Which closing (a key of `closings`) ends the talk when turns run out without an agreement. */
  lastClosing: (f: Flags) => string;
  slotDefaults: Required<Slots>;
  closings: { agreement: Tone; deteriorated: Tone } & Record<Closing, Tone>;
};

/** Fills {deliverable}, {deadline}, {partial}, {partialWhen} and capitalises the first letter. */
export function fill(text: string, slots: Slots, defaults: Required<Slots>): string {
  const out = text.replace(
    /\{(deliverable|deadline|partial|partialWhen)\}/g,
    (_, k: keyof Slots) => slots[k] ?? defaults[k],
  );
  return out.charAt(0).toUpperCase() + out.slice(1);
}
