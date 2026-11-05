import type { CriteriaScores } from '../score';
import type { Analysis } from './types';

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** The five criteria (0–1) for one message, from its signals. */
export function scoreMessage(a: Analysis): CriteriaScores {
  const s = a.signals;
  const v = (id: keyof Analysis['signals']) => s[id] ?? 0;

  const clarity =
    0.4 + v('request') * 0.3 + (v('deadline') ? 0.15 : 0) + (v('partial') ? 0.1 : 0) + (v('impact') ? 0.05 : 0) -
    v('vague') * 0.35 - v('short') * 0.25 - v('shouting') * 0.2;
  const tone =
    0.55 + v('empathy') * 0.3 + v('gratitude') * 0.1 + v('question') * 0.05 -
    v('pressure') * 0.35 - v('blame') * 0.5 - v('hostile') * 0.8 - v('shouting') * 0.3;
  const context = 0.2 + v('impact') * 0.5 + v('urgency') * 0.3 + v('request') * 0.15;
  const assertiveness =
    0.4 + v('request') * 0.25 + (v('deadline') ? 0.15 : 0) + (v('partial') ? 0.15 : 0) + v('impact') * 0.1 -
    v('vague') * 0.3 - v('pressure') * 0.3 - v('blame') * 0.3 - v('hostile') * 0.4;
  const agreements =
    0.1 + v('partial') * 0.3 + (v('deadline') ? 0.3 : 0) + v('agreement') * 0.25 + v('responsibility') * 0.2 +
    v('affirm') * 0.1 + v('question') * 0.05;

  return {
    clarity: clamp(clarity),
    tone: clamp(tone),
    context: clamp(context),
    assertiveness: clamp(assertiveness),
    agreements: clamp(agreements),
  };
}
