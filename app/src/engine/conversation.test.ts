import { describe, expect, it } from 'vitest';
import { CASES } from '../cases';
import { reply, start, timeUp } from './conversation';

describe('tiempo', () => {
  it('el tiempo cierra la conversación', () => {
    const def = CASES[1];
    const c = timeUp(start(def, 0), 5);
    expect(c.done).toBe(true);
    expect(c.endReason).toBe('time');
    expect(reply(def, c, 'hola', 6)).toBe(c);
  });
});

describe('candado de tiempo', () => {
  it.each(CASES)('$title: sin ningún mensaje, al acabarse el tiempo pasa a rojo con 0 puntos', (def) => {
    const c = timeUp(start(def, 0), 10);
    expect(c.done).toBe(true);
    expect(c.color).toBe('red');
    expect(c.points).toBe(0);
    expect(c.mission).toBe(false);
    expect(c.quadrant).toBe('deteriorated');
  });

  it('quien sí escribió conserva su barra al acabarse el tiempo', () => {
    const def = CASES[0];
    const c = timeUp(reply(def, start(def, 0), 'Entiendo que tienes mucha carga, gracias por avisarme.', 1), 10);
    expect(c.color).toBe('green');
    expect(c.points).toBeGreaterThan(0);
  });
});

describe('estructura de los casos', () => {
  it.each(CASES)('$title tiene todo lo necesario', (def) => {
    const cfg = def.v2;
    expect(def.opening.length).toBeGreaterThan(10);
    expect(def.observe).toHaveLength(4);
    expect(cfg.flags.some((f) => f.id === cfg.agreementFlag)).toBe(true);
    // Every reaction the rules can pick, and every closing, has lines.
    for (const r of cfg.reactionOrder) expect(cfg.reactions[r.reaction]?.normal.length, r.reaction).toBeGreaterThan(0);
    expect(cfg.reactions[cfg.brokenReaction]).toBeDefined();
    for (const key of ['agreement', 'deteriorated', 'last_adjustment', 'cannot_commit'])
      expect(cfg.closings[key]?.normal.length, key).toBeGreaterThan(0);
    // Line ids are unique across the case, so "never repeat" works.
    const ids = [
      ...cfg.needs.flatMap((n) => [...n.ask, ...(n.offer?.lines ?? [])]),
      ...Object.values(cfg.reactions).flatMap((t) => [...t.normal, ...t.guarded]),
      ...Object.values(cfg.closings).flatMap((t) => [...t.normal, ...t.guarded]),
    ];
    // An id may appear twice only for the very same line (one offer reachable from two needs).
    const byId = new Map<string, string>();
    for (const l of ids) {
      if (byId.has(l.id)) expect(byId.get(l.id), l.id).toBe(l.text);
      byId.set(l.id, l.text);
    }
    // Flags used by needs and stages exist.
    const flagIds = new Set(cfg.flags.map((f) => f.id));
    for (const s of cfg.stages) expect(flagIds.has(s.flag), s.flag).toBe(true);
  });
});
