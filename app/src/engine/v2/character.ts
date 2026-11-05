import type { Analysis, Character, RelationshipState } from './types';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** The most any variable may move in one turn: moods change, they do not flip. */
const MAX_STEP = 25;

/**
 * How the colleague's mood moves with each message. Kind words lower
 * defensiveness, but only a little at a time; blame and pressure raise it
 * fast. Stress drops when there is a workable plan.
 */
export function updateCharacter(c: Character, a: Analysis, planTookShape: boolean): Character {
  const s = a.signals;
  const d = { stress: 0, trust: 0, defensiveness: 0, willingness: 0 };
  if (s.empathy) {
    d.trust += 10;
    d.defensiveness -= 10;
    d.stress -= 5;
  }
  if (s.gratitude) d.trust += 4;
  if (s.impact) d.willingness += 10;
  if (s.urgency && !s.impact) d.stress += 5;
  if (s.request === 1) d.willingness += 5;
  if (s.partial) {
    d.stress -= 10;
    d.willingness += 8;
  }
  if (planTookShape) d.stress -= 10;
  if (s.vague) d.stress += 5;
  if (s.pressure) {
    d.defensiveness += 20;
    d.trust -= 10;
    d.stress += 10;
  }
  if (s.blame) {
    d.defensiveness += 25;
    d.trust -= 15;
    d.willingness -= 10;
  }
  if (s.hostile) {
    d.defensiveness += 40;
    d.trust -= 30;
    d.willingness -= 25;
  }
  if (s.shouting) d.defensiveness += 10;
  // After a tense turn, warmth works more slowly.
  if (c.defensiveness >= 50 && d.defensiveness < 0) d.defensiveness = Math.ceil(d.defensiveness / 2);

  const step = (v: number) => Math.max(-MAX_STEP, Math.min(MAX_STEP, v));
  const next = {
    stress: clamp(c.stress + step(d.stress)),
    trust: clamp(c.trust + step(d.trust)),
    defensiveness: clamp(c.defensiveness + step(d.defensiveness)),
    willingness: clamp(c.willingness + step(d.willingness)),
  };
  // Hostility is the one thing that can move a mood further in a single turn.
  if (s.hostile) next.defensiveness = clamp(c.defensiveness + d.defensiveness);
  return next;
}

export function relationship(c: Character): RelationshipState {
  if (c.defensiveness >= 70 || c.trust <= 25 || c.willingness <= 25) return 'deteriorated';
  if (c.defensiveness >= 40 || c.trust <= 45) return 'tense';
  return 'collaborative';
}

/** Guarded: still willing, but the last turns left a mark. */
export const isGuarded = (c: Character) => c.defensiveness >= 50;
