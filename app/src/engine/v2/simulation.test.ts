import { describe, expect, it } from 'vitest';
import { CASES } from '../../cases';
import { reply, start } from '../conversation';
import { BLIND } from './corpus/blind';
import { HOLDOUT } from './corpus/holdout';
import { TRAIN } from './corpus/train';

/** Small deterministic random generator, so failures reproduce. */
function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

/** Sentences long enough to matter (short tags like "¿Va?" or "Ok." may recur). */
const sentences = (t: string) =>
  t.split(/(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/).filter((x) => x.length >= 15);

describe('simulación: cientos de conversaciones con respuestas mezcladas', () => {
  it.each(CASES)('$title: el personaje responde con coherencia', (def) => {
    const pool = [TRAIN, HOLDOUT, BLIND].flatMap((c) => Object.values(c[def.id]).flat().map((s) => s.text));
    const rand = rng(def.number * 7919);
    let agreements = 0;
    for (let game = 0; game < 200; game += 1) {
      let c = start(def, 0);
      for (let turn = 0; turn < def.maxTurns && !c.done; turn += 1) {
        // Sometimes join two answers, as people do.
        const a = pool[Math.floor(rand() * pool.length)];
        const text = rand() < 0.35 ? `${a} ${pool[Math.floor(rand() * pool.length)]}` : a;
        c = reply(def, c, text, turn + 1);
        const answer = c.messages[c.messages.length - 1].text;
        const ctx = `${def.id} partida ${game}: "${text}" → "${answer}"`;
        expect(answer.trim().length, ctx).toBeGreaterThan(0);
        expect(answer, ctx).not.toMatch(/Sigo sin entender|No sé qué más decirte/i);
      }
      expect(c.done, `${def.id} partida ${game} no terminó`).toBe(true);
      expect(c.turn).toBeLessThanOrEqual(def.maxTurns);
      const lines = c.messages.filter((m) => m.from === 'partner').slice(1).flatMap((m) => sentences(m.text));
      expect(new Set(lines).size, `${def.id} partida ${game} repitió: ${lines.join(' | ')}`).toBe(lines.length);
      if (c.mission) agreements += 1;
    }
    // Random answers rarely settle a plan, but some do: the engine is not stuck.
    expect(agreements).toBeGreaterThan(0);
  });
});
