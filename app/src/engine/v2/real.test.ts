import { describe, expect, it } from 'vitest';
import { CASE_BY_ID } from '../../cases';
import type { CaseId } from '../../cases/types';
import { reply, start } from '../conversation';
import type { Conversation } from '../conversation';
import { analyze } from './analyzer';

/** Conversations played in real sessions, kept as regression tests. */
const play = (id: CaseId, ...texts: string[]): Conversation =>
  texts.reduce((c, t, i) => reply(CASE_BY_ID[id], c, t, i + 1), start(CASE_BY_ID[id], 0));
const partner = (c: Conversation) => c.messages.filter((m) => m.from === 'partner').slice(1).map((m) => m.text);

describe('analizador: frases reales', () => {
  it('imperativos, entregable con nombre y "la otra parte"', () => {
    const a = analyze('Entrega la Miras hoy y mañana temprano la otra parte');
    expect(a.signals.request).toBe(1);
    expect(a.deliverable).toBe('la Miras');
    expect(a.signals.partial).toBe(1);
    expect(a.partialWhen).toBe('hoy');
    expect(a.deadline).toBe('mañana temprano');
  });

  it('"mándalo antes de las dos" y "tengo que presentar a las cuatro"', () => {
    const a = analyze('Yo tengo que presentar a las cuatro, por favor mándalo antes de las dos');
    expect(a.signals.request).toBeGreaterThan(0);
    expect(a.signals.impact).toBe(1);
    expect(a.signals.urgency).toBe(1);
    expect(a.deadline).toBe('antes de las dos');
  });

  it('"¿qué te parece si…?" es una propuesta, no un acuerdo', () => {
    expect(analyze('¿Qué te parece si organizamos un archivo de planeación?').signals.agreement).toBeUndefined();
  });

  it('conserva etiquetas cortas del entregable', () => {
    expect(analyze('Necesito la sección A y B completas.').deliverable).toBe('la sección A y B');
  });
});

describe('caso 1 · conversaciones reales', () => {
  it('Monica: entrega por partes y hora límite → misión cumplida con sus datos', () => {
    const c = play(
      'entrega',
      'De acuerdo, cuando puedes enviarlo ?',
      'Entrega la Miras hoy y mañana temprano la otra parte',
      'Yo tengo que presentar a las cuatro, por favor mándalo antes de las dos',
    );
    expect(partner(c)[1]).toContain('Entonces quedamos así');
    expect(c.mission).toBe(true);
    expect(partner(c)[2]).toContain('la Miras antes de las dos');
    expect(partner(c)[2]).toContain('mañana temprano');
  });

  it('Nando: sin entrega parcial no dice "hoy y el resto hoy"', () => {
    const c = play(
      'entrega',
      'Ooohhh, que mal, en verdad necesitamos la información completa para hoy, te parece si te ayudo un poco para tenerla lista antes de que termine la jornada',
      'La fecha límite es hoy, así que que te parece si la terminamos para que puedas irte a buena hora',
      'Necesito la sección A y B completas para poder armarlo y enviar así la sección C Y D para el cliente.',
    );
    expect(c.mission).toBe(true);
    expect(partner(c).join(' ')).not.toMatch(/hoy y el resto hoy/);
    expect(partner(c)[2]).toContain('la sección A y B');
  });
});

describe('caso 2 · conversaciones reales', () => {
  it('Ana: su carga se reconoce y Mariana no la vuelve a preguntar', () => {
    const c = play(
      'urgente',
      'Hola, tengo una entrega para la tarde de hoy podría mandarlo mañana?',
      'Tengo la entrega de los reportes y las evaluaciones de 360',
    );
    expect(c.v2!.memory.flags.capacity_explained).toBe(true);
    expect(partner(c).join(' ')).not.toMatch(/qué tienes (en curso|comprometido)/);
  });

  it('Jhonny: Mariana responde a su propuesta', () => {
    const c = play(
      'urgente',
      'Enterado, tengo que trabajar también otros entregables que están próximos a ser entregados, que te parece esto, ya que el entregable urge para mañana, lo termino hoy y ya mañana puedo seguir trabajando en los otros entregables pendientes.',
    );
    expect(partner(c)[0]).toContain('propuesta');
  });
});

describe('caso 3 · conversaciones reales', () => {
  const monica = [
    'Entiendo como te sientes, pero que te parece si organizamos un archivo de planeacion, y hacemos reuniones de check point para ir alineando los entregables',
    'Falta al detalle, algunas temas de redacción, presentación o incluso datos incorrectos',
    'En el archivo de data mandaste una base errónea, debemos poner Más atenuación para que los datos sean correctos',
    'Mandaste el archivo mal',
  ];

  it('Monica: Luis responde a su propuesta y no finge que le preguntaron', () => {
    const c = play('mejorar', ...monica);
    const lines = partner(c);
    expect(lines[0]).not.toMatch(/Gracias por (preguntar|querer escucharme)/);
    expect(lines[0]).toContain('Organizarnos así');
    expect(lines.join(' ')).not.toContain('Sigo sin entender');
    expect(new Set(lines).size).toBe(lines.length);
    expect(c.v2!.memory.flags.facts_described).toBe(true);
  });

  it('una propuesta en el primer mensaje no cierra el acuerdo de golpe', () => {
    const c = play('mejorar', monica[0]);
    expect(c.done).toBe(false);
  });

  it('Guajolote: Luis reacciona a la ayuda que le ofrecen', () => {
    const c = play(
      'mejorar',
      'Lamento que esto te haga sentir así, es solo que no podemos seguir entregando las actividades con errores ya que el flujo de trabajo de todos termina afectado',
      'En la sección "A" hay errores en el párrafo 7, 9, 20 y 21. Que te parece si te ayudo un poco, no te dejaré solo',
    );
    expect(partner(c)[1]).toContain('Eso me ayudaría');
  });
});
