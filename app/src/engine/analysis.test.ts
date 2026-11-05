import { describe, expect, it } from 'vitest';
import { CASE_BY_ID } from '../cases';
import type { Player } from '../realtime/types';
import { colorCounts, ranking, signalStats } from './analysis';
import { reply, start } from './conversation';

const def = CASE_BY_ID.entrega;
const player = (id: string, texts: string[]): Player => ({
  id,
  sessionCode: 'ABCDE',
  nickname: id,
  joinedAt: 0,
  convo: texts.reduce((c, t, i) => reply(def, c, t, i + 1), start(def, 0)),
});

const good = player('ana', [
  'Entiendo que se te juntaron cosas. La necesito porque el proyecto depende de eso. ¿Qué pasó?',
  'Te propongo que me mandes lo que ya tengas mañana a las 10 am. ¿Te parece bien?',
]);
const tense = player('beto', ['Otra vez lo mismo, siempre llegas tarde.', 'Necesito la información porque el proyecto depende de ella.']);
const idle: Player = { id: 'caro', sessionCode: 'ABCDE', nickname: 'caro', joinedAt: 0, convo: null };

describe('análisis de resultados', () => {
  it('ordena por resultado y deja fuera a quien no jugó', () => {
    const r = ranking([tense, idle, good]);
    expect(r.map((x) => x.player.id)).toEqual(['ana', 'beto']);
    expect(r[0].place).toBe(1);
  });

  it('cuenta colores', () => {
    expect(colorCounts([good, tense, idle])).toEqual({ green: 1, yellow: 1, red: 0 });
  });

  it('separa estrategias y errores', () => {
    const { strengths, mistakes } = signalStats(def, [good, tense]);
    expect(strengths.find((s) => s.signal === 'empathy')?.withAgreement).toBe(1);
    expect(mistakes.find((s) => s.signal === 'blame')?.people).toBe(1);
    expect(strengths[0].example?.nickname).toBe('ana');
  });
});
