import { describe, expect, it } from 'vitest';
import { CASES, CASE_BY_ID } from '../cases';
import { analyze, reply, start, timeUp } from './conversation';
import type { Conversation } from './conversation';

const play = (id: keyof typeof CASE_BY_ID, ...texts: string[]): Conversation => {
  const def = CASE_BY_ID[id];
  return texts.reduce((c, t, i) => reply(def, c, t, i + 1), start(def, 0));
};

describe('categorías', () => {
  const cat = (id: keyof typeof CASE_BY_ID, text: string) => analyze(CASE_BY_ID[id], text).category;


  it('caso 2', () => {
    expect(cat('urgente', 'No puedo, no me toca.')).toBe('escalate');
    expect(cat('urgente', 'Sí claro, sin problema, mañana lo tienes.')).toBe('unclear');
    expect(
      cat('urgente', 'Con gusto apoyo, pero ya tengo dos entregables en curso para esta semana. ¿Cuál prefieres que priorice?'),
    ).toBe('effective');
  });

  it('caso 3', () => {
    expect(cat('mejorar', 'Eres muy descuidado, siempre te equivocas.')).toBe('escalate');
    expect(cat('mejorar', 'No te preocupes, no es tan importante, sigue así.')).toBe('unclear');
    expect(
      cat('mejorar', 'Valoro tu esfuerzo. En los últimos tres reportes detecté errores que afectan al cliente. ¿Cómo lo ves tú?'),
    ).toBe('effective');
  });
});

describe('conversación', () => {


  it('dos escaladas llevan a rojo', () => {
    const c = play('urgente', 'No puedo, no me toca.', 'Ya te dije que no, es tu problema.');
    expect(c.color).toBe('red');
    expect(c.points).toBeLessThan(80);
  });

  it('se acaba por turnos sin acuerdo', () => {
    const c = play('mejorar', 'Ok', 'Bueno', 'No se', 'A ver', 'Sale', 'Ok');
    expect(c.done).toBe(true);
    expect(c.mission).toBe(false);
    expect(c.endReason).toBe('turns');
    expect(c.color).toBe('red');
  });

  it('el tiempo cierra la conversación', () => {
    const c = timeUp(start(CASE_BY_ID.urgente, 0), 5);
    expect(c.done).toBe(true);
    expect(c.endReason).toBe('time');
    expect(reply(CASE_BY_ID.urgente, c, 'hola', 6)).toBe(c);
  });

  it('caso 2 completo', () => {
    const c = play(
      'urgente',
      'Con gusto apoyo. Hoy tengo dos entregables en curso con fecha esta semana y me preocupa que alguno se retrase.',
      'Te propongo priorizar el nuevo y mover el reporte mensual al lunes. ¿Qué prefieres?',
    );
    expect(c.mission).toBe(true);
  });

  it('caso 3 completo', () => {
    const c = play(
      'mejorar',
      'Valoro tu esfuerzo. En los últimos tres reportes detecté errores en los datos que afectan al cliente. ¿Cómo lo ves tú?',
      'Gracias por contarme. Te propongo apoyarte con una lista de verificación y revisar juntos antes de enviar. Hagamos seguimiento cada viernes.',
    );
    expect(c.mission).toBe(true);
  });
});

describe('estructura de los casos', () => {
  it.each(CASES.filter((c) => !c.v2))('$title tiene todo lo necesario', (def) => {
    expect(def.opening.length).toBeGreaterThan(10);
    expect(def.pieces.length).toBeGreaterThan(0);
    for (const p of def.pieces) expect(p.ask.length).toBeGreaterThan(0);
    for (const lines of Object.values(def.replies)) {
      if (Array.isArray(lines)) expect(lines.length).toBeGreaterThan(0);
    }
    expect(def.observe).toHaveLength(4);
  });
});

describe('candado de tiempo', () => {
  it.each(CASES)('$title: sin ningún mensaje, al acabarse el tiempo pasa a rojo con 0 puntos', (def) => {
    const c = timeUp(start(def, 0), 10);
    expect(c.done).toBe(true);
    expect(c.color).toBe('red');
    expect(c.points).toBe(0);
    expect(c.mission).toBe(false);
    if (def.v2) expect(c.quadrant).toBe('deteriorated');
  });

  it('quien sí escribió conserva su barra al acabarse el tiempo', () => {
    const def = CASES[0];
    const c = timeUp(reply(def, start(def, 0), 'Entiendo que tienes mucha carga, gracias por avisarme.', 1), 10);
    expect(c.color).toBe('green');
    expect(c.points).toBeGreaterThan(0);
  });
});
