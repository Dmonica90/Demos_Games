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
    <main className="screen-in mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-10 sm:px-8 sm:py-14">
      <header className="mb-8">
        <Brand />
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
          Comunica mejor, <span className="text-brand">por escrito.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg">
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
                  className={`card flex h-full cursor-pointer flex-col p-6 transition-all duration-200 sm:p-8 ${
                    active ? 'shadow-brand outline-2 outline-accent' : 'hover:-translate-y-0.5'
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
                  <span className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                      {String(c.number).padStart(2, '0')}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
                        active ? 'border-accent bg-accent text-xs text-white' : 'border-edge'
                      }`}
                    >
                      {active ? '✔' : ''}
                    </span>
                  </span>
                  <span className="mt-4 text-xl font-bold text-ink">{c.title}</span>
                  <span className="eyebrow mt-1 !text-[0.68rem] !text-ink-dim">{c.relation}</span>
                  <span className="mt-4 text-sm leading-relaxed">{c.context}</span>
                  <span className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm text-accent-deep">
                    <strong className="font-bold">Objetivo: </strong>
                    {c.goal}
                  </span>
                  <span className="mt-auto pt-5 text-xs font-semibold text-ink-dim">
                    {c.maxTurns} mensajes · {Math.round(c.durationS / 60)} minutos
                  </span>
                </label>
              </StaggerItem>
            );
          })}
        </Stagger>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={create} disabled={busy} sfx="confirm">
          {busy ? 'Creando…' : 'Crear sesión y mostrar QR 📲'}
        </Button>
        {transport.kind === 'local' && (
          <p className="rounded-full bg-[#fefce8] px-4 py-2 text-sm font-medium text-warn-ink">
            Modo local: sin Supabase configurado, solo pueden unirse otras pestañas de este navegador.
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
