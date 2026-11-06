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

  it('rescate: solo en secciones con pregunta, una vez; la vida sube con el correcto y baja con el incorrecto', () => {
    let { st, tokens } = joined(['Ana', 'Beto', 'Caro']);
    st = S.setSession(st, { voteOpen: true });
    st = S.vote(st, tokens[0], 2);
    st = S.vote(st, tokens[2], 2);
    expect(st.players[1].life).toBe(80);
    st = S.rescue(st, tokens[1], 'Swap', 'r1', 0);
    expect(() => S.rescue(st, tokens[1], 'otra', 'r2', 0)).toThrow('Ya pediste');
    st = S.markRescue(st, 'r1', true);
    expect(st.players[1].life).toBe(95);
    st = S.rescue(st, tokens[0], 'nose', 'r3', 0);
    st = S.markRescue(st, 'r3', true);
    expect(st.players[0].life).toBe(100); // nunca pasa de 100
    st = S.rescue(st, tokens[2], 'mal', 'r4', 0);
    st = S.markRescue(st, 'r4', false);
    expect(st.players[2].life).toBe(95);
    st = S.setSession(st, { section: 1 });
    expect(() => S.rescue(st, tokens[0], 'x', 'r5', 0)).toThrow('no tiene');
  });

  it('con las barras apagadas la vida no cambia, y nunca baja de 0', () => {
    let { st, tokens } = joined(['Ana', 'Beto', 'Caro']);
    st = S.setSession(st, { voteOpen: true, pointsOn: false });
    st = S.vote(st, tokens[0], 2);
    expect(st.players[1].life).toBe(100);
    st = { ...st, players: st.players.map((p) => (p.num === 2 ? { ...p, life: 5 } : p)) };
    st = S.setSession(st, { pointsOn: true });
    st = S.vote(st, tokens[2], 2);
    expect(st.players[1].life).toBe(0);
  });

  it('se juega con al menos 3 y con un infiltrado', () => {
    expect(() => S.confirm(S.createState('X'), slots.slice(0, 2), ['persona_normal'])).toThrow('al menos 3');
    expect(() =>
      S.confirm(S.createState('X'), slots.map(() => ({ role: 'merchant_fan' as const, decoy: null })), ['persona_normal']),
    ).toThrow('infiltrado');
  });

  it('la pantalla pública trae nombres y vida, ordenados, sin roles ni votos', () => {
    let { st, tokens } = joined(['Ana', 'Beto', 'Caro']);
    st = S.setSession(st, { voteOpen: true });
    st = S.vote(st, tokens[0], 2);
    const board = S.boardView(st);
    expect(board.players.map((p) => p.name)).toEqual(['Ana', 'Caro', 'Beto']);
    expect(board.voted).toBe(1);
    const json = JSON.stringify(board);
    expect(json).not.toMatch(/phishing"|merchant|vendedor|voterId|targetId/);
  });

  it('el votado pasa a auditor, sigue jugando y su rescate cuenta como de auditor', () => {
    let { st, tokens } = joined(['Ana', 'Beto', 'Caro']);
    st = S.setAuditor(st, 'id-0', true);
    const view = S.playerView(st, tokens[1])!;
    expect(view.roster[0]).toEqual({ num: 1, name: 'Ana', auditor: true, wasPhishing: true });
    expect(view.roster[1].wasPhishing).toBeNull();
    st = S.rescue(st, tokens[0], 'BlitzPay 2012', 'r1', 0);
    expect(st.rescues[0].auditor).toBe(true);
  });

  it('aliados: solo con la ronda abierta, sin elegirse, se puede cambiar y se califica por equipo al cerrar', () => {
    // slots: 1 phishing (imita Venta), 2 merchant_fan, 3 vendedor_clip; tardíos: 4 vendedor_miclip, 5 persona_normal
    let { st, tokens } = joined(['Ana', 'Beto', 'Caro', 'Dani', 'Eli']);
    expect(() => S.allies(st, tokens[2], [4], 0)).toThrow('no está abierta');
    st = S.setSession(st, { saleOpen: true });
    expect(() => S.allies(st, tokens[2], [3], 0)).toThrow('No te elijas');
    expect(() => S.allies(st, tokens[2], [9], 0)).toThrow('no existe');
    st = S.allies(st, tokens[2], [1, 2], 0);
    st = S.allies(st, tokens[2], [4, 2], 1); // Caro cambia de opinión
    expect(st.allies).toHaveLength(1);
    expect(S.playerView(st, tokens[2])!.myAllies).toEqual([4, 2]);
    expect(S.playerView(st, tokens[2])!.allyScore).toBeNull(); // aún abierta
    st = S.allies(st, tokens[4], [1], 2); // persona normal: sin equipo
    st = S.setSession(st, { saleOpen: false });
    expect(S.playerView(st, tokens[2])!.allyScore).toEqual({ right: 1, total: 2 }); // Dani sí (Venta), Beto no
    expect(S.playerView(st, tokens[4])!.allyScore).toEqual({ right: 0, total: 1 });
    expect(st.players.every((p) => p.life === 100)).toBe(true); // los aliados no mueven la vida
  });

  it('la vista del celular trae los nombres para votar, pero no roles ajenos', () => {
    const { st, tokens } = joined(['Ana', 'Beto', 'Caro']);
    const view = S.playerView(st, tokens[1])!;
    expect(view.roster.map((r) => r.name)).toEqual(['Ana', 'Beto', 'Caro']);
    expect(JSON.stringify(view.roster)).not.toMatch(/phishing"|vendedor|merchant/);
    expect(JSON.stringify(view)).not.toContain('phishing');
  });

  it('cerrar borra a todos', () => {
    const { st } = joined(['Ana', 'Beto']);
    const closed = S.close(st);
    expect(closed.players).toEqual([]);
    expect(closed.session.status).toBe('cerrada');
    expect(JSON.stringify(closed)).not.toContain('Ana');
  });
});
