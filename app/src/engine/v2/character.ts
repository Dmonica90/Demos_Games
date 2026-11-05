import type { V2CaseConfig } from './config';
import type { Analysis, Character, RelationshipState } from './types';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** The most any variable may move in one turn: moods change, they do not flip. */
const MAX_STEP = 25;
const KEYS = ['stress', 'trust', 'defensiveness', 'willingness'] as const;

/**
 * How the character's mood moves with a message, by the case's rules. Kind
 * words lower defensiveness only a little at a time (half as fast once the
 * character is on the defensive); attacks raise it fast.
 */
export function updateCharacter(cfg: V2CaseConfig, c: Character, a: Analysis, planTookShape: boolean): Character {
  const s = a.signals;
  const d: Character = { stress: 0, trust: 0, defensiveness: 0, willingness: 0 };
  const uncapped: Character = { stress: 0, trust: 0, defensiveness: 0, willingness: 0 };
  for (const rule of cfg.moodRules) {
    if ((s[rule.signal] ?? 0) < (rule.minStrength ?? 0.5)) continue;
    if (rule.unless?.some((u) => s[u])) continue;
    // An insult can harden the character past the per-turn cap.
    const free = cfg.uncapped?.includes(rule.signal);
    for (const k of KEYS) (free && k === 'defensiveness' ? uncapped : d)[k] += rule.delta[k] ?? 0;
  }
  if (planTookShape) d.stress -= 10;
  if (c.defensiveness >= 50 && d.defensiveness < 0) d.defensiveness = Math.ceil(d.defensiveness / 2);

  const step = (v: number) => Math.max(-MAX_STEP, Math.min(MAX_STEP, v));
  const next = {} as Character;
  for (const k of KEYS) next[k] = clamp(c[k] + step(d[k]) + uncapped[k]);
  return next;
}

export function relationship(c: Character): RelationshipState {
  if (c.defensiveness >= 70 || c.trust <= 25 || c.willingness <= 25) return 'deteriorated';
  if (c.defensiveness >= 40 || c.trust <= 45) return 'tense';
  return 'collaborative';
}

/** Guarded: still talking, but the conversation left a mark. */
export const isGuarded = (c: Character) => c.defensiveness >= 50;
