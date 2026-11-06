import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { GROUP_LABEL, MERCHANT_ROLES, ROLES, SALE_CRITERIA, SECTIONS, SELLER_ROLES, pistasFor } from '../../codigo/content';
import { ccStore, useCCSession, usePlayerView } from '../../codigo/hooks';
import { cc } from '../../codigo/transport';
import type { PlayerView } from '../../codigo/types';
import { Brand } from '../../components/game';
import { Button } from '../../components/ui';
import { normalizeCode } from '../../realtime/types';
import { go } from '../../router';

const input =
  'min-h-13 w-full rounded-2xl border-2 border-edge bg-panel px-4 text-lg text-ink outline-none transition-colors focus:border-accent';

function Shell({ children }: { children: ReactNode }) {
  return <main className="screen-in mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">{children}</main>;
}
function Note({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <div className="card mt-[20vh] p-8 text-center">
        <Brand label="Código Clip · Inducción" />
        <div className="mt-3">{children}</div>
      </div>
    </Shell>
  );
}

/** The phone: join with a name, then the character card and whatever the host has opened. */
export function Player({ code }: { code: string | null }) {
  if (!code) return <EnterCode />;
  return <PlayerIn key={code} code={code} />;
}

function EnterCode() {
  const [code, setCode] = useState('');
  return (
    <Note>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (normalizeCode(code).length === 5) go(`/codigo/jugar/${normalizeCode(code)}`);
        }}
        className="flex flex-col gap-3 text-left"
      >
        <label htmlFor="cc-code-in" className="font-semibold text-ink">
          Código de la sesión
        </label>
        <input id="cc-code-in" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={`${input} tracking-[0.3em] uppercase`} />
        <Button type="submit" onClick={undefined}>
          Entrar
        </Button>
      </form>
    </Note>
  );
}

function PlayerIn({ code }: { code: string }) {
  const [token, setToken] = useState(() => ccStore.get(`token:${code}`));
  const { data: session } = useCCSession(code);
  const { data: view } = usePlayerView(code, token);

  if (session === undefined) return <Note>Cargando…</Note>;
  if (session === null) return <Note>No existe la sesión {code}. Revisa el código.</Note>;
  if (session.status === 'cerrada')
    return (
      <Note>
        <h1 className="text-2xl">¡Gracias por jugar! 🎉</h1>
        <p className="mt-2">La sesión terminó y tus datos se borraron.</p>
      </Note>
    );
  if (session.status === 'registro') return <Note>El presentador está repartiendo los roles. Espera un momento…</Note>;
  if (!token || view === null)
    return (
      <JoinForm
        code={code}
        onToken={(t) => {
          ccStore.set(`token:${code}`, t);
          setToken(t);
        }}
      />
    );
  if (!view) return <Note>Cargando tu personaje…</Note>;
  return <Game code={code} token={token} view={view} />;
}

function JoinForm({ code, onToken }: { code: string; onToken: (t: string) => void }) {
  const [name, setName] = useState('');
  const [taken, setTaken] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = name.trim().replace(/\s+/g, ' ');

  const send = async (claim: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const r = await cc.join(code, clean, claim);
      if (r.status === 'ok') onToken(r.token);
      else setTaken(r.num);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (clean) void send(false);
  };

  return (
    <Shell>
      <div className="card mt-[8vh] p-6">
        <Brand label="Código Clip · Inducción" />
        <h1 className="mt-2 text-3xl">
          Código <span className="text-brand">Clip</span> 🕵️
        </h1>
        <p className="mt-2 text-sm">
          Sesión <strong className="text-ink">{code}</strong>. Escribe tu nombre: con él recuperas tu personaje si cierras la
          pantalla. Solo el presentador lo ve, y se borra al cerrar la sesión.
        </p>
        {taken === null ? (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            <label htmlFor="cc-name" className="font-semibold text-ink">
              Tu nombre
            </label>
            <input id="cc-name" autoFocus autoComplete="name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className={input} />
            <Button type="submit" disabled={!clean || busy} onClick={undefined} sfx="confirm">
              {busy ? 'Entrando…' : 'Recibir mi personaje'}
            </Button>
          </form>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <p className="font-semibold text-ink">
              Ya hay alguien llamado “{clean}” (Jugador {taken}). ¿Eres tú?
            </p>
            <Button onClick={() => void send(true)} disabled={busy}>
              Sí, recuperar mi personaje
            </Button>
            <Button tone="ghost" onClick={() => setTaken(null)}>
              No, soy otra persona (agrego mi apellido)
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-alarm-ink">
            {error}
          </p>
        )}
      </div>
    </Shell>
  );
}

function Game({ code, token, view }: { code: string; token: string; view: PlayerView }) {
  const { me, session } = view;
  const def = ROLES[me.role];
  const pistas = pistasFor(me.role, me.decoy);
  const section = SECTIONS[session.section];
  const auditors = view.roster.filter((r) => r.auditor);

  return (
    <Shell>
      <header className="hud -mx-4 -mt-6 flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] uppercase opacity-90">Eres el</p>
          <p data-testid="cc-me-num" className="text-3xl font-extrabold">
            Jugador {me.num}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{section.titulo}</p>
          {session.pointsOn && <p data-testid="cc-points">{me.points} pts</p>}
        </div>
      </header>

      {me.auditor && (
        <p className="rounded-2xl bg-[#eff6ff] p-4 text-sm font-semibold text-[var(--cc-ally)]">
          🔍 Te votaron: ahora eres <strong>auditor</strong>. Sigues jugando y tienes tu propia pregunta rescate.
        </p>
      )}

      <section className="card p-5" aria-labelledby="cc-role">
        <p className="eyebrow">Tu personaje · secreto</p>
        <h1 id="cc-role" className="mt-1 text-2xl">
          {def.emoji} {def.nombre}
        </h1>
        <p className="mt-2">{def.descripcion}</p>
        <p className="mt-2 text-sm font-semibold text-ink">
          {me.role === 'phishing'
            ? `Finge ser del ${GROUP_LABEL[me.decoy ?? 'comercio']}. Que nadie te descubra.`
            : def.grupo
              ? `Tus aliados son del ${GROUP_LABEL[def.grupo]}: compartirán alguna de tus pistas.`
              : 'No tienes grupo: ayuda a descubrir a los phishing.'}
        </p>
        <h2 className="mt-5 text-lg">Tus 5 pistas</h2>
        <ol className="mt-2 flex flex-col gap-2">
          {pistas.map((p, i) => (
            <li key={p.id} className="panel rounded-2xl p-3 text-ink">
              <strong className="text-accent-deep">{i + 1}.</strong> {p.texto}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-dim">Pregúntalas a los demás o al facilitador. Si alguien comparte tu pista, es tu aliado.</p>
      </section>

      {session.roundOpen && (
        <p className="rounded-2xl bg-accent-soft p-4 font-semibold text-accent-deep">
          💬 Ronda de preguntas abierta: busca a quien comparta tus pistas.
        </p>
      )}
      {session.voteOpen && <VotePanel code={code} token={token} view={view} />}
      <RescuePanel code={code} token={token} view={view} />
      {session.saleOpen && <SalePanel code={code} token={token} view={view} />}

      {auditors.length > 0 && (
        <section className="card p-5">
          <h2 className="text-lg">Auditores</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {auditors.map((a) => (
              <li key={a.num}>
                Jugador {a.num}: {a.wasPhishing ? <strong className="text-[var(--cc-threat)]">era phishing 🎣</strong> : 'no era phishing'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };
  const err = error && (
    <p role="alert" className="mt-2 text-sm font-medium text-alarm-ink">
      {error}
    </p>
  );
  return { act, busy, err };
}

function VotePanel({ code, token, view }: { code: string; token: string; view: PlayerView }) {
  const { act, busy, err } = useAction();
  const others = view.roster.filter((r) => r.num !== view.me.num);
  return (
    <section className="card p-5" aria-labelledby="cc-vote">
      <h2 id="cc-vote" className="text-lg">
        🗳️ ¿Quién crees que es phishing?
      </h2>
      {view.votedFor !== null ? (
        <p className="mt-2 font-semibold text-ink">Votaste por el Jugador {view.votedFor}. Un voto por ronda.</p>
      ) : (
        <>
          <p className="mt-1 text-sm">Un solo voto. No se puede cambiar.</p>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {others.map((r) => (
              <li key={r.num}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(() => cc.vote(code, token, r.num))}
                  aria-label={`Votar por el Jugador ${r.num}`}
                  className="h-14 w-full rounded-2xl border-2 border-edge bg-panel text-xl font-extrabold text-ink hover:border-accent"
                >
                  {r.num}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {err}
    </section>
  );
}

function RescuePanel({ code, token, view }: { code: string; token: string; view: PlayerView }) {
  const { act, busy, err } = useAction();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const sec = SECTIONS[view.session.section];
  const q = view.me.auditor ? sec.auditor : sec.rescate;
  if (!q) return null;
  const done = view.rescues.find((r) => r.section === view.session.section);
  return (
    <section className="card p-5" aria-labelledby="cc-rescue">
      <h2 id="cc-rescue" className="text-lg">
        🛟 Pregunta rescate · {sec.tema}
        {view.me.auditor && ' (auditor)'}
      </h2>
      {done ? (
        <p className="mt-2 font-semibold text-ink">
          {done.status === 'pendiente' ? 'Enviada. El presentador la está revisando.' : done.status === 'correcta' ? '✓ ¡Correcta! Conservas tu puntaje.' : '✗ No era esa. Repasa la presentación.'}
        </p>
      ) : !open ? (
        <>
          <p className="mt-1 text-sm">Una por sección. Respóndela para no perder tu puntaje.</p>
          <Button tone="ghost" className="mt-3 w-full" onClick={() => setOpen(true)}>
            Pedir pregunta rescate
          </Button>
        </>
      ) : (
        <form
          className="mt-2 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.trim()) void act(() => cc.rescue(code, token, answer));
          }}
        >
          <p className="font-semibold text-ink">{q.pregunta}</p>
          <label htmlFor="cc-answer" className="sr-only">
            Tu respuesta
          </label>
          <textarea id="cc-answer" rows={3} maxLength={400} value={answer} onChange={(e) => setAnswer(e.target.value)} className={`${input} py-3`} />
          <Button type="submit" onClick={undefined} disabled={busy || !answer.trim()}>
            Enviar respuesta
          </Button>
        </form>
      )}
      {err}
    </section>
  );
}

function SalePanel({ code, token, view }: { code: string; token: string; view: PlayerView }) {
  const { act, busy, err } = useAction();
  const [seller, setSeller] = useState<number | null>(null);
  const [criteria, setCriteria] = useState<string[]>([]);
  const role = view.me.role;

  if (SELLER_ROLES.includes(role))
    return (
      <section className="card p-5">
        <h2 className="text-lg">🤝 Venta abierta</h2>
        <p className="mt-1">Busca a un merchant y convéncelo. Él decide en su celular, con los criterios que se ven en pantalla.</p>
      </section>
    );
  if (!MERCHANT_ROLES.includes(role))
    return (
      <section className="card p-5">
        <h2 className="text-lg">🤝 Venta abierta</h2>
        <p className="mt-1">Observa: los vendedores intentan convencer a los merchants.</p>
      </section>
    );

  const options = view.roster.filter((r) => r.num !== view.me.num && !view.judged.includes(r.num));
  const toggle = (id: string) => setCriteria((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const decide = (convinced: boolean) =>
    seller !== null &&
    void act(async () => {
      await cc.sale(code, token, seller, criteria, convinced);
      setSeller(null);
      setCriteria([]);
    });

  return (
    <section className="card p-5" aria-labelledby="cc-sale">
      <h2 id="cc-sale" className="text-lg">
        🤝 ¿Te convencieron?
      </h2>
      {view.judged.length > 0 && <p className="mt-1 text-sm">Ya calificaste a: {view.judged.map((n) => `Jugador ${n}`).join(', ')}.</p>}
      <label htmlFor="cc-seller" className="mt-3 block font-semibold text-ink">
        ¿Quién te vendió?
      </label>
      <select id="cc-seller" value={seller ?? ''} onChange={(e) => setSeller(e.target.value ? Number(e.target.value) : null)} className={input}>
        <option value="">Elige un número</option>
        {options.map((r) => (
          <option key={r.num} value={r.num}>
            Jugador {r.num}
          </option>
        ))}
      </select>
      <fieldset className="mt-3 flex flex-col gap-2">
        <legend className="font-semibold text-ink">Marca lo que sí hizo</legend>
        {SALE_CRITERIA.map((c) => (
          <label key={c.id} className="panel flex items-start gap-3 rounded-2xl p-3 text-sm">
            <input type="checkbox" checked={criteria.includes(c.id)} onChange={() => toggle(c.id)} className="mt-0.5 h-5 w-5 accent-[var(--cc-primary)]" />
            {c.texto}
          </label>
        ))}
      </fieldset>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button disabled={busy || seller === null} onClick={() => decide(true)} className="!px-3">
          Me convenció
        </Button>
        <Button tone="ghost" disabled={busy || seller === null} onClick={() => decide(false)} className="!px-3">
          No me convenció
        </Button>
      </div>
      {err}
    </section>
  );
}
