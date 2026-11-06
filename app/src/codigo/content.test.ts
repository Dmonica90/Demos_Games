import { describe, expect, it } from 'vitest';
import { DECOY_INDIVIDUAL, DECOY_SHARED, LISTEN, MIN_PLAYERS, RESCUE_SECTIONS, ROLES, SECTIONS, SHARED, pistasFor, tipsFor } from './content';
import type { RoleId } from './types';
import { readFileSync } from 'node:fs';
import { MAX_ALLIES } from './state';

describe('Código Clip: contenido', () => {
  it('cada rasgo sabe en qué sección escucharlo', () => {
    const all = [...SHARED.comercio, ...SHARED.venta, ...DECOY_SHARED, ...DECOY_INDIVIDUAL.comercio, ...DECOY_INDIVIDUAL.venta, ...Object.values(ROLES).flatMap((r) => r.individuales)];
    const ids = new Set(SECTIONS.map((x) => x.id));
    for (const p of all) {
      expect(LISTEN[p.id], p.id).toBeTruthy();
      expect(ids.has(LISTEN[p.id].seccion), p.id).toBe(true);
    }
  });

  it('cada personaje tiene tips en cada sección; las de rescate incluyen el tema del rescate', () => {
    for (const role of Object.keys(ROLES) as RoleId[])
      SECTIONS.forEach((sec, i) => {
        const tips = tipsFor(role, role === 'phishing' ? 'comercio' : null, i);
        expect(tips.length, `${role} ${sec.id}`).toBeGreaterThan(0);
        if (sec.rescate) expect(tips.some((t) => t.kind === 'rescate')).toBe(true);
      });
    expect(tipsFor('merchant_fan', null, 0).some((t) => t.texto.includes('Clip Plus'))).toBe(true);
    expect(tipsFor('merchant_fan', null, 1)[0].texto).toMatch(/platica/);
  });

  it('TP va antes que Ciberseguridad', () => {
    expect(SECTIONS.map((x) => x.id)).toEqual(['quienes', 'firma', 'promesa', 'comida', 'equipos', 'tp', 'ciber']);
  });

  it('los rasgos son frases del personaje, no preguntas', () => {
    for (const role of Object.keys(ROLES) as RoleId[])
      for (const p of pistasFor(role, role === 'phishing' ? 'venta' : null)) expect(p.texto, p.id).not.toMatch(/[¿?]/);
  });

  it('cada jugador ve 5 pistas, todas con referencia y estado', () => {
    for (const role of Object.keys(ROLES) as RoleId[]) {
      for (const decoy of role === 'phishing' ? (['comercio', 'venta'] as const) : [null]) {
        const list = pistasFor(role, decoy);
        expect(list, role).toHaveLength(5);
        for (const p of list) {
          expect(p.ref.length).toBeGreaterThan(2);
          expect(['propuesta', 'diseño', 'pendiente']).toContain(p.estado);
        }
      }
    }
  });

  it('el phishing no comparte pistas exactas con ningún grupo', () => {
    const real = new Set(pistasFor('merchant_fan', null).concat(pistasFor('vendedor_clip', null)).map((p) => p.texto));
    for (const p of pistasFor('phishing', 'venta')) expect(real.has(p.texto)).toBe(false);
  });

  it('firma de contrato y comida no tienen rescate; las demás traen referencia', () => {
    expect(SECTIONS.find((s) => s.id === 'firma')!.rescate).toBeNull();
    expect(SECTIONS.find((s) => s.id === 'comida')!.rescate).toBeNull();
    for (const i of RESCUE_SECTIONS) {
      expect(SECTIONS[i].rescate!.ref).toBeTruthy();
      expect(SECTIONS[i].auditor!.ref).toBeTruthy();
    }
  });

  it('la migración SQL usa las mismas secciones con rescate y el mismo número de secciones', () => {
    const read = (f: string) => readFileSync(new URL(`../../../supabase/migrations/${f}`, import.meta.url), 'utf8');
    expect(read('002_codigo_clip.sql')).toContain(`v_section > ${SECTIONS.length - 1}`);
    expect(read('003_codigo_clip_v2.sql')).toContain(`array[${RESCUE_SECTIONS.join(', ')}]`);
    expect(read('003_codigo_clip_v2.sql')).toContain(`< ${MIN_PLAYERS} then`);
    expect(read('004_codigo_clip_v3.sql')).toContain(`> ${MAX_ALLIES} then`);
  });
});
