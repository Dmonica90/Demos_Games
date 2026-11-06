import type { Group, RoleId, Slot, Vote } from './types';

/** Infiltrados (phishing) por tamaño del grupo: la regla del brief. */
export function infiltrados(n: number): number {
  if (n <= 0) return 0;
  if (n <= 9) return 1;
  if (n <= 15) return 2;
  if (n <= 20) return 3;
  return 4;
}

/**
 * Order in which the other roles are dealt: a seller and a merchant come in
 * early, so the sales game works even with few people, and both groups fill
 * up evenly.
 */
export const DEAL_ORDER: RoleId[] = [
  'vendedor_clip',
  'merchant_fan',
  'vendedor_miclip',
  'merchant_desconfiado',
  'fan_miclip',
  'merchant_confuso',
  'persona_normal',
];

export type Counts = Record<RoleId, number>;

export const emptyCounts = (): Counts => ({
  phishing: 0,
  merchant_fan: 0,
  merchant_desconfiado: 0,
  merchant_confuso: 0,
  vendedor_clip: 0,
  vendedor_miclip: 0,
  fan_miclip: 0,
  persona_normal: 0,
});

/** The suggested split for n people; the host can adjust it before confirming. */
export function distribuir(n: number): Counts {
  const counts = emptyCounts();
  counts.phishing = Math.min(n, infiltrados(n));
  for (let i = 0; i < n - counts.phishing; i += 1) counts[DEAL_ORDER[i % DEAL_ORDER.length]] += 1;
  return counts;
}

export const sum = (c: Counts) => Object.values(c).reduce((a, b) => a + b, 0);

type Rand = () => number;

function shuffle<T>(list: T[], rand: Rand): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The shuffled deck. Each phishing card imitates one group, chosen at random. */
export function baraja(counts: Counts, rand: Rand = Math.random): Slot[] {
  const cards: Slot[] = [];
  for (const [role, k] of Object.entries(counts) as [RoleId, number][]) {
    for (let i = 0; i < k; i += 1) {
      const decoy: Group | null = role === 'phishing' ? (rand() < 0.5 ? 'comercio' : 'venta') : null;
      cards.push({ role, decoy });
    }
  }
  return shuffle(cards, rand);
}

/**
 * Roles for latecomers, in turn: the roles of the split that are not phishing,
 * so the number of infiltrados never changes.
 */
export function overflowFor(counts: Counts): RoleId[] {
  const roles = DEAL_ORDER.filter((r) => counts[r] > 0);
  return roles.length ? roles : ['persona_normal'];
}

/** Votes of one round: who got how many, and who is on top (several on a tie). */
export function tally(votes: Vote[], round: number) {
  const counts = new Map<string, number>();
  for (const v of votes) if (v.round === round) counts.set(v.targetId, (counts.get(v.targetId) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  const top = max > 0 ? [...counts].filter(([, k]) => k === max).map(([id]) => id) : [];
  return { counts, max, top };
}
