import { describe, expect, it } from 'vitest';
import { CASE_BY_ID } from '../../cases';
import { entregaConfig } from '../../cases/v2/entrega.config';
import { reply, start } from '../conversation';
import type { Conversation } from '../conversation';
import { analyze } from './analyzer';

const def = CASE_BY_ID.entrega;
const play = (...texts: string[]): Conversation => texts.reduce((c, t, i) => reply(def, c, t, i + 1), start(def, 0));
const last = (c: Conversation) => c.messages[c.messages.length - 1].text;
const partnerLines = (c: Conversation) => c.messages.filter((m) => m.from === 'partner').slice(1).map((m) => m.text);

describe('analizador', () => {
  it('detecta varias señales en un mensaje', () => {
    const a = analyze(
      'Entiendo que estés saturado, pero sin esos datos no puedo cerrar el reporte. ¿Me puedes enviar la parte que ya tienes antes de las cuatro?',
    );
    expect(a.signals.empathy).toBe(1);
    expect(a.signals.impact).toBe(1);
    expect(a.signals.deadline).toBe(1);
    expect(a.signals.agreement).toBeUndefined();
    expect(a.deadline).toBe('antes de las cuatro');
  });

  it('respeta las negaciones', () => {
    expect(analyze('No entiendo por qué te tardas tanto').signals.empathy).toBeUndefined();
    expect(analyze('No entiendo por qué te tardas tanto').signals.vague).toBe(1);
    expect(analyze('No es urgente, la verdad').signals.urgency).toBeUndefined();
  });

  it('extrae qué se necesita y para cuándo', () => {
    const a = analyze('Necesito los datos de ventas: mándame lo validado hoy y el resto mañana a las 11.');
    expect(a.deliverable).toBe('los datos de ventas');
    expect(a.signals.request).toBe(1);
    expect(a.partialWhen).toBe('hoy');
    expect(a.deadline).toBe('mañana a las 11');
    expect(analyze('Necesito la información').signals.request).toBe(0.5);
  });
});

describe('las cinco pruebas del motor (caso 1)', () => {
  it('empática y concreta: avanza hacia el acuerdo y lo cierra al confirmar', () => {
    const c1 = play(
      'Entiendo que estés saturado. Para cerrar el proyecto necesito los datos de ventas. ¿Puedes enviarme lo que ya está validado hoy y completar el resto mañana a las 11?',
    );
    expect(c1.done).toBe(false);
    expect(last(c1)).toContain('mañana a las 11');
    expect(c1.v2!.memory.pending_offer).toBe('confirm');
    const c2 = reply(def, c1, 'Sí, perfecto, gracias.', 9);
    expect(c2.mission).toBe(true);
    expect(c2.color).toBe('green');
    expect(c2.quadrant).toBe('effective');
  });

  it('agresiva: el compañero se pone a la defensiva y la relación se deteriora', () => {
    const c = play('Siempre haces lo mismo, es tu problema, hazlo como puedas.', 'Ya te dije que lo necesito, no me importa.');
    expect(c.v2!.character.defensiveness).toBeGreaterThanOrEqual(70);
    expect(c.color).toBe('red');
    expect(last(c)).not.toMatch(/\?$/); // no longer collaborates by asking the next step
  });

  it('ambigua: pide aclaración sin repetir la misma pregunta', () => {
    const c = play('Ok, cuando puedas.', 'Bueno.');
    const asks = partnerLines(c);
    expect(asks[0]).not.toBe(asks[1]);
    expect(c.color).toBe('yellow');
  });

  it('directa pero efectiva: llega al acuerdo sin perder el verde', () => {
    const c = play(
      'Necesito los datos de ventas para cerrar el reporte del cliente. ¿Me envías lo que tengas antes de las 4 y el resto mañana a primera hora?',
      'De acuerdo, quedamos así.',
    );
    expect(c.mission).toBe(true);
    expect(c.color).toBe('green');
    expect(last(c)).toContain('antes de las 4');
  });

  it('empática sin acuerdo: buena comunicación, misión sin resolver', () => {
    const c = play(
      'Entiendo que tienes mucha carga, gracias por avisarme.',
      'Sé que estás haciendo lo posible, no te preocupes.',
      'Gracias por tu esfuerzo, de verdad lo valoro mucho.',
    );
    expect(c.done).toBe(true);
    expect(c.mission).toBe(false);
    expect(c.quadrant).toBe('good_no_deal');
  });
});

describe('memoria y continuidad', () => {
  it('nunca repite una línea ni regresa al inicio', () => {
    const variants = [
      ['Ok.', 'Pues no sé.', 'A ver.'],
      ['Entiendo que tienes mucha carga.', 'Te entiendo, de verdad.', 'Gracias.'],
      ['Sin esos datos no puedo cerrar el reporte.', 'Sí, me sirve.', 'Va.'],
    ];
    for (const texts of variants) {
      const lines = partnerLines(play(...texts));
      expect(new Set(lines).size).toBe(lines.length);
      // The opening question ("¿Es para hoy…?") is never asked twice.
      expect(lines.filter((l) => l.includes('¿Es para hoy')).length).toBeLessThanOrEqual(1);
    }
  });

  it('ofrece una entrega parcial y una fecha, y recuerda lo aceptado', () => {
    const c1 = play('Sin esos datos de ventas no puedo cerrar el reporte del cliente, necesito los datos de ventas.');
    expect(c1.v2!.memory.pending_offer).toBe('partial');
    const c2 = reply(def, c1, 'Sí, me sirve.', 5);
    expect(c2.v2!.memory.partial_delivery_proposed).toBe(true);
    expect(c2.v2!.memory.pending_offer).toBe('deadline');
    const c3 = reply(def, c2, 'Va, perfecto.', 6);
    expect(c3.mission).toBe(true);
    expect(last(c3)).toContain('mañana a mediodía');
  });

  it('una frase amable no borra de golpe la defensividad', () => {
    const c = play('Siempre haces lo mismo, es tu culpa.', 'Perdón, entiendo que tienes mucha carga.');
    expect(c.v2!.character.defensiveness).toBeGreaterThan(entregaConfig.character.defensiveness);
    expect(c.color).not.toBe('green');
  });

  it('cierra a los 3 turnos con un cierre natural', () => {
    const c = play('Ok.', 'Bueno.', 'Sale.');
    expect(c.done).toBe(true);
    expect(c.v2!.closing).toBe('cannot_commit');
  });
});
