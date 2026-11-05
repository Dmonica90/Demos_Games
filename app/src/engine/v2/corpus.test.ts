import { describe, expect, it } from 'vitest';
import { CASE_BY_ID } from '../../cases';
import type { CaseId } from '../../cases/types';
import { analyze } from './analyzer';
import { BLIND } from './corpus/blind';
import { HOLDOUT } from './corpus/holdout';
import { TRAIN } from './corpus/train';
import type { Corpus } from './corpus/types';

/** Share of samples where the analyzer finds the intended intention. */
export function coverage(corpus: Corpus) {
  const misses: string[] = [];
  let total = 0;
  for (const [id, intents] of Object.entries(corpus) as [CaseId, Corpus[CaseId]][]) {
    const cfg = CASE_BY_ID[id].v2;
    for (const [intent, samples] of Object.entries(intents)) {
      for (const sample of samples) {
        total += 1;
        const a = analyze(sample.text, cfg.families, cfg.concrete);
        for (const rule of cfg.suppress ?? []) if (rule.when.some((w) => a.signals[w])) delete a.signals[rule.signal];
        const hit = sample.expect.some((e) => a.signals[e]);
        const wrong = sample.not?.find((n) => a.signals[n]);
        if (!hit || wrong) misses.push(`${id}/${intent}: "${sample.text}" → ${Object.keys(a.signals).join(',') || '∅'}`);
      }
    }
  }
  return { total, misses, rate: (total - misses.length) / total };
}

describe('banco de frases variadas', () => {
  it('el analizador reconoce la intención en las frases de entrenamiento', () => {
    const { rate, misses } = coverage(TRAIN);
    if (misses.length) console.log(misses.join('\n'));
    expect(rate).toBeGreaterThanOrEqual(0.95);
  });

  it('y también en frases nuevas que no se usaron para ajustar las reglas', () => {
    const { rate, misses, total } = coverage(HOLDOUT);
    console.log(`holdout: ${Math.round(rate * 100)}% de ${total}`);
    if (misses.length) console.log(misses.join('\n'));
    expect(rate).toBeGreaterThanOrEqual(0.85);
  });

  it('prueba ciega: frases escritas después del último ajuste', () => {
    const { rate, misses, total } = coverage(BLIND);
    console.log(`ciega: ${Math.round(rate * 100)}% de ${total}`);
    if (misses.length) console.log(misses.join('\n'));
    expect(rate).toBeGreaterThanOrEqual(0.8);
  });
});
