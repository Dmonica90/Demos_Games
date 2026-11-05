import { useState } from 'react';
import { CASES } from '../../cases';
import type { CaseId } from '../../cases/types';
import { Brand } from '../../components/game';
import { Button, Stagger, StaggerItem } from '../../components/ui';
import { store } from '../../hooks';
import { transport } from '../../realtime';
import { go } from '../../router';

/** The host picks one case; everyone in the session will play exactly that one. */
export function HostHome() {
  const [selected, setSelected] = useState<CaseId>('entrega');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const def = CASES.find((c) => c.id === selected)!;
    setBusy(true);
    setError(null);
    try {
      const { session, hostKey } = await transport.createSession(def.id, def.durationS);
      store.set(`host:${session.code}`, hostKey);
      go(`/host/${session.code}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-10 sm:px-8">
      <header className="mb-8">
        <Brand />
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Crea una sesión</h1>
        <p className="mt-2 max-w-2xl text-ink-dim">
          Elige un caso. Todas las personas recibirán el mismo mensaje inicial, al mismo tiempo y con las mismas reglas.
          Después proyecta el código QR para que se unan desde su celular.
        </p>
      </header>

      <fieldset>
        <legend className="sr-only">Caso</legend>
        <Stagger className="grid gap-4 md:grid-cols-3">
          {CASES.map((c) => {
            const active = c.id === selected;
            return (
              <StaggerItem key={c.id}>
                <label
                  className={`panel flex h-full cursor-pointer flex-col rounded-2xl p-5 transition ${
                    active ? 'ring-2 ring-accent' : 'hover:border-accent/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="case"
                    value={c.id}
                    checked={active}
                    onChange={() => setSelected(c.id)}
                    className="sr-only"
                  />
                  <span className="text-xs font-semibold text-accent uppercase">Caso {c.number}</span>
                  <span className="mt-1 text-xl font-bold">{c.title}</span>
                  <span className="mt-1 text-sm text-ink-dim">{c.relation}</span>
                  <span className="mt-4 text-sm leading-relaxed">{c.context}</span>
                  <span className="mt-4 rounded-xl bg-panel-2 p-3 text-sm">
                    <strong className="font-semibold">Objetivo: </strong>
                    {c.goal}
                  </span>
                  <span className="mt-auto pt-4 text-xs text-ink-dim">
                    {c.maxTurns} turnos · {Math.round(c.durationS / 60)} minutos
                  </span>
                </label>
              </StaggerItem>
            );
          })}
        </Stagger>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={create} disabled={busy} sfx="confirm">
          {busy ? 'Creando…' : 'Crear sesión y mostrar QR'}
        </Button>
        {transport.kind === 'local' && (
          <p className="text-sm text-warn">
            Modo local: sin Supabase configurado, solo pueden unirse otras pestañas de este navegador.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-alarm">
            No se pudo crear la sesión: {error}
          </p>
        )}
      </div>
    </main>
  );
}
