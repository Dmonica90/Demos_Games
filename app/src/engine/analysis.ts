import type { CaseDef } from '../cases/types';
import type { Player } from '../realtime/types';
import type { Color, Conversation } from './conversation';
import { finalScore } from './conversation';
import { NEGATIVE, POSITIVE } from './signals';
import type { SignalId } from './signals';

export type Ranked = { player: Player; convo: Conversation; score: number; place: number };

/**
 * Agreement first (through the score, which weighs it), then points, then the
 * fewest turns, then whoever finished first.
 */
export function ranking(players: Player[]): Ranked[] {
  const played = players.filter((p): p is Player & { convo: Conversation } => p.convo !== null);
  const sorted = played
    .map((p) => ({ player: p, convo: p.convo, score: finalScore(p.convo) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.convo.turn - b.convo.turn ||
        (a.convo.finishedAt ?? Infinity) - (b.convo.finishedAt ?? Infinity) ||
        a.player.joinedAt - b.player.joinedAt,
    );
  return sorted.map((r, i) => ({ ...r, place: i + 1 }));
}

export function colorCounts(players: Player[]): Record<Color, number> {
  const counts: Record<Color, number> = { green: 0, yellow: 0, red: 0 };
  for (const p of players) if (p.convo) counts[p.convo.color] += 1;
  return counts;
}

export type SignalStat = {
  signal: SignalId;
  /** Participants who did it at least once. */
  people: number;
  /** Of those, how many reached an agreement. */
  withAgreement: number;
  /** The best-scoring message showing it, for the debrief. */
  example?: { nickname: string; text: string };
};

export function signalStats(def: CaseDef, players: Player[]) {
  const stats = new Map<SignalId, SignalStat>();
  const best = new Map<SignalId, number>();
  for (const p of players) {
    if (!p.convo) continue;
    const seen = new Set<SignalId>();
    for (const m of p.convo.messages) {
      if (m.from !== 'me') continue;
      for (const s of m.signals) {
        if (!def.relevant.includes(s)) continue;
        seen.add(s);
        if (POSITIVE.includes(s) && m.category === 'effective' && m.quality > (best.get(s) ?? -1)) {
          best.set(s, m.quality);
          const stat = stats.get(s) ?? { signal: s, people: 0, withAgreement: 0 };
          stats.set(s, { ...stat, example: { nickname: p.nickname, text: m.text } });
        }
      }
    }
    for (const s of seen) {
      const stat = stats.get(s) ?? { signal: s, people: 0, withAgreement: 0 };
      stats.set(s, {
        ...stat,
        people: stat.people + 1,
        withAgreement: stat.withAgreement + (p.convo.mission ? 1 : 0),
      });
    }
  }
  const all = [...stats.values()].filter((s) => s.people > 0);
  return {
    strengths: all.filter((s) => POSITIVE.includes(s.signal)).sort((a, b) => b.withAgreement - a.withAgreement || b.people - a.people),
    mistakes: all.filter((s) => NEGATIVE.includes(s.signal)).sort((a, b) => b.people - a.people),
  };
}
