import { describe, expect, it } from 'vitest';
import * as S from './state';
import type { CCState, Slot } from './types';

const slots: Slot[] = [
  { role: 'phishing', decoy: 'venta' },
  { role: 'merchant_fan', decoy: null },
  { role: 'vendedor_clip', decoy: null },
];

function game(): CCState {
  return S.confirm(S.createState('ABCDE'), slots, ['vendedor_miclip', 'persona_normal']);
}
function joined(names: string[]) {
  let st = game();
  const tokens: string[] = [];
  names.forEach((n, i) => {
    const r = S.join(st, n, false, `id-${i}`, i);
    st = r.state;
    if (r.result.status === 'ok') tokens.push(r.result.token);
  });
  return { st, tokens };
}

describe('Código Clip: reglas', () => {
  it('no se entra antes de repartir los roles', () => {
    expect(() => S.join(S.createState('ABCDE'), 'Ana', false, 'x', 0)).toThrow('no está abierta');
  });

  it('reparte por orden de llegada y los tardíos toman la lista sin phishing', () => {
    const { st } = joined(['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fer']);
    expect(st.players.map((p) => p.role)).toEqual([
      'phishing', 'merchant_fan', 'vendedor_clip', 'vendedor_miclip', 'persona_normal', 'vendedor_miclip',
    ]);
    expect(st.players.filter((p) => p.role === 'phishing')).toHaveLength(1);
  });

  it('el mismo nombre recupera el personaje (sin acentos ni mayúsculas)', () => {
    const { st } = joined(['Ána López']);
    expect(S.join(st, 'ana  lopez', false, 'otro', 1).result).toEqual({ status: 'exists', num: 1 });
    expect(S.join(st, 'ANA LOPEZ', true, 'otro', 1).result).toEqual({ status: 'ok', token: 'id-0' });
  });

  it('un voto por ronda, nunca por uno mismo', () => {
    let { st, tokens } = joined(['Ana', 'Beto', 'Caro']);
    expect(() => S.vote(st, tokens[0], 2)).toThrow('cerrada');
    st = S.setSession(st, { voteOpen: true });
    expect(st.session.voteRound).toBe(1);
    expect(() => S.vote(st, tokens[0], 1)).toThrow('ti');
    st = S.vote(st, tokens[0], 2);
    expect(() => S.vote(st, tokens[0], 3)).toThrow('Ya votaste');
    expect(S.playerView(st, tokens[0])!.votedFor).toBe(2);
    st = S.setSession(S.setSession(st, { voteOpen: false }), { voteOpen: true });
    expect(st.session.voteRound).toBe(2);
    expect(S.playerView(st, tokens[0])!.votedFor).toBeNull();
    st = S.vote(st, tokens[0], 3);
    expect(st.votes).toHaveLength(2);
  });

  it('rescate: solo en secciones con pregunta, una vez, con puntos opcionales', () => {
    let { st, tokens } = joined(['Ana', 'Beto']);
    st = S.rescue(st, tokens[1], 'Swap', 'r1', 0);
    expect(() => S.rescue(st, tokens[1], 'otra', 'r2', 0)).toThrow('Ya pediste');
    st = S.markRescue(st, 'r1', true);
    expect(st.players[1].points).toBe(3);
    st = S.setSession(st, { section: 1 });
    expect(() => S.rescue(st, tokens[0], 'x', 'r3', 0)).toThrow('no tiene');
    st = S.setSession(st, { section: 2, pointsOn: false });
    st = S.rescue(st, tokens[0], 'Impact on', 'r4', 0);
    st = S.markRescue(st, 'r4', true);
    expect(st.players[0].points).toBe(0);
  });

  it('el votado pasa a auditor, sigue jugando y su rescate cuenta como de auditor', () => {
    let { st, tokens } = joined(['Ana', 'Beto']);
    st = S.setAuditor(st, 'id-0', true);
    const view = S.playerView(st, tokens[1])!;
    expect(view.roster[0]).toEqual({ num: 1, auditor: true, wasPhishing: true });
    expect(view.roster[1].wasPhishing).toBeNull();
    st = S.rescue(st, tokens[0], 'BlitzPay 2012', 'r1', 0);
    expect(st.rescues[0].auditor).toBe(true);
  });

  it('venta: solo el merchant decide, una vez por vendedor', () => {
    let { st, tokens } = joined(['Ana', 'Beto', 'Caro']);
    expect(() => S.sale(st, tokens[1], 3, [], true, 's', 0)).toThrow('no está abierta');
    st = S.setSession(st, { saleOpen: true });
    expect(() => S.sale(st, tokens[0], 3, [], true, 's', 0)).toThrow('Solo un merchant');
    st = S.sale(st, tokens[1], 3, ['dato', 'inventado'], true, 's1', 0);
    expect(st.sales[0].criteria).toEqual(['dato']);
    expect(() => S.sale(st, tokens[1], 3, [], false, 's2', 0)).toThrow('Ya calificaste');
    expect(S.playerView(st, tokens[1])!.judged).toEqual([3]);
  });

  it('la vista del celular no trae nombres ni roles ajenos', () => {
    const { st, tokens } = joined(['Ana', 'Beto']);
    const json = JSON.stringify(S.playerView(st, tokens[1]));
    expect(json).not.toContain('Ana');
    expect(json).not.toContain('phishing');
  });

  it('cerrar borra a todos', () => {
    const { st } = joined(['Ana', 'Beto']);
    const closed = S.close(st);
    expect(closed.players).toEqual([]);
    expect(closed.session.status).toBe('cerrada');
    expect(JSON.stringify(closed)).not.toContain('Ana');
  });
});
