import { useMemo, useState } from 'react';
import { GROUP_LABEL, MIN_PLAYERS, ROLES } from '../../codigo/content';
import { ccStore } from '../../codigo/hooks';
import { baraja, distribuir, infiltrados, overflowFor, sum } from '../../codigo/roles';
import type { Counts } from '../../codigo/roles';
import { cc } from '../../codigo/transport';
import type { RoleId } from '../../codigo/types';
import { Brand } from '../../components/game';
import { Button } from '../../components/ui';
import { go } from '../../router';

const ORDER: RoleId[] = [
  'phishing',
  'merchant_fan',
  'merchant_desconfiado',
  'merchant_confuso',
  'vendedor_clip',
  'vendedor_miclip',
  'fan_miclip',
  'persona_normal',
];

/**
 * Paso 1 del host: cuántas personas hay. El sistema sugiere el reparto (los
 * infiltrados salen de la tabla) y el host puede ajustarlo antes de confirmar.
 * Al confirmar se reparten los roles, una sola vez.
 */
export function HostRegister() {
  const [raw, setRaw] = useState('12');
  const n = Math.round(Number(raw)) || 0;
  const valid = n >= MIN_PLAYERS && n <= 80;
  const [counts, setCounts] = useState<Counts>(() => distribuir(12));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = sum(counts);
  const suggested = useMemo(() => infiltrados(Math.max(n, MIN_PLAYERS)), [n]);

  const changeN = (value: string) => {
    setRaw(value);
    const v = Math.round(Number(value));
    if (v >= MIN_PLAYERS && v <= 80) setCounts(distribuir(v));
  };
  const step = (role: RoleId, d: number) => setCounts((c) => ({ ...c, [role]: Math.max(0, c[role] + d) }));

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const { code, hostKey } = await cc.create();
      ccStore.set(`host:${code}`, hostKey);
      await cc.confirm(code, hostKey, baraja(counts), overflowFor(counts));
      go(`/codigo/host/${code}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-10 sm:px-8">
      <header>
        <a href="#/" className="text-sm font-semibold text-ink-dim hover:text-ink">
          ← Menú
        </a>
        <Brand className="mt-4" label="Inducción" />
        <h1 className="mt-2 text-4xl sm:text-5xl">
          Código <span className="text-brand">Clip</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg">
          Registra cuántas personas hay. Los roles se reparten una sola vez al confirmar, antes de la primera plática. Si
          alguien llega tarde, entra con un rol que ya existe, nunca como phishing.
        </p>
      </header>

      <section className="card mt-8 p-6 sm:p-8">
        <label htmlFor="cc-n" className="text-lg font-bold text-ink">
          Participantes
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <input
            id="cc-n"
            type="number"
            min={MIN_PLAYERS}
            max={80}
            value={raw}
            onChange={(e) => changeN(e.target.value)}
            className="min-h-14 w-32 rounded-2xl border-2 border-edge bg-panel px-4 text-3xl font-extrabold text-ink outline-none focus:border-accent"
          />
          <p className="text-sm">
            Con {n} {n === 1 ? 'persona' : 'personas'} entran{' '}
            <strong className="text-[var(--cc-threat)]">
              {suggested} infiltrado{suggested === 1 ? '' : 's'} (phishing)
            </strong>
            . Regla: de 3 a 9 → 1, de 10 a 15 → 2, de 16 a 20 → 3, 21 o más → 4. Mínimo 3 personas.
          </p>
        </div>

        <h2 className="mt-8 text-lg">Reparto sugerido (ajústalo si quieres)</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ORDER.map((role) => {
            const def = ROLES[role];
            return (
              <li key={role} className="panel flex items-center gap-3 rounded-2xl p-3">
                <span aria-hidden="true" className="text-2xl">
                  {def.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{def.nombre}</span>
                  <span className="block text-xs text-ink-dim">{def.grupo ? GROUP_LABEL[def.grupo] : 'Sin grupo'}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Quitar ${def.nombre}`}
                  onClick={() => step(role, -1)}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-edge text-lg font-bold"
                >
                  −
                </button>
                <span data-testid={`count-${role}`} className="w-8 text-center text-xl font-extrabold text-ink">
                  {counts[role]}
                </span>
                <button
                  type="button"
                  aria-label={`Agregar ${def.nombre}`}
                  onClick={() => step(role, 1)}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-edge text-lg font-bold"
                >
                  +
                </button>
              </li>
            );
          })}
        </ul>
        <p className={`mt-4 text-sm font-semibold ${valid && total === n ? 'text-safe-ink' : 'text-alarm-ink'}`} aria-live="polite">
          {!valid
            ? `Se juega con al menos ${MIN_PLAYERS} personas (máximo 80).`
            : total === n
              ? `Listo: ${total} roles para ${n} personas.`
              : `El reparto suma ${total}; deben ser ${n}.`}
        </p>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button onClick={confirm} disabled={busy || !valid || total !== n || counts.phishing < 1} sfx="confirm">
          {busy ? 'Repartiendo…' : 'Confirmar y repartir roles'}
        </Button>
        {cc.kind === 'local' && (
          <p className="rounded-full bg-[#fefce8] px-4 py-2 text-sm font-medium text-warn-ink">
            Modo local: solo para probar en este navegador.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-alarm-ink">
            No se pudo crear la sesión: {error}
          </p>
        )}
      </div>
    </main>
  );
}
