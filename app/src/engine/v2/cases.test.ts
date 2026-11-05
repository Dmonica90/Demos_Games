import { describe, expect, it } from 'vitest';
import { CASES, CASE_BY_ID } from '../../cases';
import type { CaseId } from '../../cases/types';
import { reply, start } from '../conversation';
import type { Conversation } from '../conversation';

const play = (id: CaseId, ...texts: string[]): Conversation =>
  texts.reduce((c, t, i) => reply(CASE_BY_ID[id], c, t, i + 1), start(CASE_BY_ID[id], 0));
const last = (c: Conversation) => c.messages[c.messages.length - 1].text;
const partnerLines = (c: Conversation) =>
  c.messages
    .filter((m) => m.from === 'partner')
    .slice(1)
    .flatMap((m) => m.text.split(/(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/));

describe('caso 2 · Todo es urgente (Mariana)', () => {
  it('expone su carga y pide priorizar: Mariana propone, decide y cierran', () => {
    const c = play(
      'urgente',
      'Con gusto apoyo, pero ya tengo dos entregables en curso para esta semana y me preocupa que alguno se retrase. ¿Cuál prefieres que priorice?',
      'Te propongo mover el reporte mensual al lunes y entregarte lo nuevo mañana a mediodía.',
      'De acuerdo, quedamos así.',
    );
    expect(c.mission).toBe(true);
    expect(c.color).toBe('green');
    expect(last(c)).toContain('mañana a mediodía');
  });

  it('acepta sin explicar su carga: Mariana cuenta con todo y se acumulan los compromisos', () => {
    const c1 = play('urgente', 'Sí claro, sin problema, mañana lo tienes.');
    expect(last(c1)).toContain('cuento con esto');
    expect(last(c1)).not.toContain('?'); // happy, she asks nothing else
    expect(c1.color).toBe('yellow');
    const c = reply(CASE_BY_ID.urgente, reply(CASE_BY_ID.urgente, c1, 'Va.', 2), 'Ok.', 3);
    expect(c.mission).toBe(false);
    expect(c.v2!.closing).toBe('overcommitted');
  });

  it('un "no puedo" seco la pone a la defensiva', () => {
    const c = play('urgente', 'No puedo, no me toca.');
    expect(c.v2!.character.defensiveness).toBeGreaterThanOrEqual(40);
    expect(c.color).toBe('yellow');
    expect(last(c)).toMatch(/Cómo que no|esperaba más disposición/);
  });

  it('con su carga explicada, Mariana ofrece mover algo y recuerda el sí', () => {
    const c1 = play('urgente', 'Entiendo que es urgente. Ahorita tengo dos entregables en curso con fecha esta semana.');
    expect(c1.v2!.memory.pending_offer).toBe('move-report-early');
    // "esta semana" was about the other work, not a date for this one.
    expect(c1.v2!.memory.flags.deadline_defined).toBe(false);
    const c2 = reply(CASE_BY_ID.urgente, c1, 'Sí, me ayuda mucho.', 2);
    expect(c2.v2!.memory.flags.priority_decided).toBe(true);
    const c3 = reply(CASE_BY_ID.urgente, c2, 'Va, perfecto.', 3);
    expect(c3.mission).toBe(true);
  });

  it('ambigua: no resuelve y nunca repite una pregunta', () => {
    const c = play('urgente', 'Ok.', 'A ver.', 'Bueno.');
    expect(c.mission).toBe(false);
    const lines = partnerLines(c);
    expect(new Set(lines).size).toBe(lines.length);
  });
});

describe('caso 3 · Necesitamos mejorar (Luis)', () => {
  it('hechos, escucha, acciones y seguimiento: compromiso en 4 turnos', () => {
    const c = play(
      'mejorar',
      'Valoro tu esfuerzo. En los últimos tres reportes encontré errores en las cifras que generaron retrabajo al equipo. ¿Cómo lo ves tú?',
      'Gracias por contarme. Podemos usar una lista de verificación antes de enviar y te apoyo la primera semana.',
      'Revisemos cómo vas el próximo viernes.',
      'De acuerdo, quedamos así.',
    );
    expect(c.mission).toBe(true);
    expect(c.color).toBe('green');
    expect(c.quadrant).toBe('effective');
  });

  it('etiquetar a la persona lo pone a la defensiva y deteriora la conversación', () => {
    const c = play('mejorar', 'Eres muy descuidado, siempre te equivocas.', 'Es que no te importa.');
    expect(c.color).toBe('red');
    expect(c.v2!.relationship).toBe('deteriorated');
  });

  it('evitar el problema lo deja confundido y sin acciones', () => {
    const c = play('mejorar', 'No te preocupes, no es tan importante, sigue así.', 'Todo bien.', 'Ok.', 'Va.');
    expect(partnerLines(c)[0]).toContain('¿todo bien?');
    expect(c.mission).toBe(false);
    const lines = partnerLines(c);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('acciones sin seguimiento: buena conversación, sin compromiso completo', () => {
    const c = play(
      'mejorar',
      'En los últimos reportes vi errores en los datos de ventas que generaron retrabajo.',
      'Entiendo. ¿Cómo lo ves tú? ¿Qué está pasando?',
      'Sí, me parece bien.',
      'Gracias.',
    );
    expect(c.mission).toBe(false);
    expect(c.v2!.closing).toBe('last_adjustment');
    expect(c.color).not.toBe('red');
  });

  it('si nadie le pregunta, Luis lo reclama', () => {
    const c = play('mejorar', 'En los últimos reportes vi errores en los datos de ventas que generaron retrabajo.');
    expect(last(c)).toContain('nadie me había preguntado');
  });
});

describe('los tres casos', () => {
  it.each(CASES)('$title: una frase amable no borra de golpe la defensividad', (def) => {
    const c = play(def.id, 'Siempre haces lo mismo, es tu culpa.', 'Perdón, entiendo que tienes mucha carga.');
    expect(c.v2!.character.defensiveness).toBeGreaterThan(def.v2.character.defensiveness);
    expect(c.color).not.toBe('green');
  });

  it.each(CASES)('$title: cierra al llegar al número de turnos', (def) => {
    const c = play(def.id, ...Array(def.maxTurns).fill('Ok.'));
    expect(c.done).toBe(true);
    expect(c.turn).toBe(def.maxTurns);
  });
});
