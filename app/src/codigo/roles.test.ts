import { describe, expect, it } from 'vitest';
import { baraja, distribuir, infiltrados, overflowFor, sum, tally } from './roles';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('infiltrados', () => {
  it.each([
    [1, 1], [9, 1], [10, 2], [15, 2], [16, 3], [20, 3], [21, 4], [60, 4],
  ])('%i personas → %i', (n, k) => expect(infiltrados(n)).toBe(k));
});

describe('reparto', () => {
  it('suma siempre n y respeta la tabla', () => {
    for (let n = 1; n <= 40; n += 1) {
      const c = distribuir(n);
      expect(sum(c)).toBe(n);
      expect(c.phishing).toBe(Math.min(n, infiltrados(n)));
    }
  });
  it('con pocos jugadores ya hay vendedor y merchant', () => {
    const c = distribuir(4);
    expect(c.vendedor_clip).toBe(1);
    expect(c.merchant_fan).toBe(1);
  });
  it('la baraja tiene las cartas pedidas y cada phishing imita un grupo', () => {
    const c = distribuir(18);
    const deck = baraja(c, seeded(7));
    expect(deck).toHaveLength(18);
    expect(deck.filter((s) => s.role === 'phishing')).toHaveLength(3);
    for (const s of deck) expect(s.decoy === null).toBe(s.role !== 'phishing');
    expect(deck.filter((s) => s.role === 'phishing').every((s) => s.decoy === 'comercio' || s.decoy === 'venta')).toBe(true);
  });
  it('quien llega tarde nunca es phishing', () => {
    expect(overflowFor(distribuir(3))).not.toContain('phishing');
    expect(overflowFor({ ...distribuir(1) })).toEqual(['persona_normal']);
  });
});

describe('tally', () => {
  it('cuenta por ronda y detecta empates', () => {
    const votes = [
      { round: 1, voterId: 'a', targetId: 'x' },
      { round: 1, voterId: 'b', targetId: 'y' },
      { round: 2, voterId: 'a', targetId: 'y' },
    ];
    expect(tally(votes, 1).top.sort()).toEqual(['x', 'y']);
    expect(tally(votes, 2).top).toEqual(['y']);
    expect(tally(votes, 3).top).toEqual([]);
  });
});
