import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { GROUP_LABEL, MERCHANT_ROLES, ROLES, SALE_CRITERIA, SECTIONS, SELLER_ROLES, pistasFor } from '../../codigo/content';
import { ccStore, useCCSession, usePlayerView } from '../../codigo/hooks';
import { cc } from '../../codigo/transport';
import type { PlayerView } from '../../codigo/types';
import { Brand, ScoreBar } from '../../components/game';
import { lifeColor } from './shared';
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
  const [step, setStep] = useState<'intro' | 'howto' | 'ready'>(() => (ccStore.get(`intro:${code}`) ? 'ready' : 'intro'));
  const finishIntro = () => {
    ccStore.set(`intro:${code}`, '1');
    setStep('ready');
  };
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
  if (!token && step === 'intro') return <Intro onStart={() => setStep('howto')} />;
  if (!token && step === 'howto') return <HowTo onDone={finishIntro} />;
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

const INTRO_LINES = ['Bienvenido a Clip', 'Gracias por elegirnos', 'Hoy vas a recibir una carta secreta…', '…y a descubrir quién es quién.'];

/** The short text cinematic the phone shows after scanning. */
function Intro({ onStart }: { onStart: () => void }) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= INTRO_LINES.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), 1100);
    return () => clearTimeout(id);
  }, [shown]);
  return (
    <main className="hud flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">Código Clip</p>
        <ul className="mt-6 flex flex-col gap-4" aria-live="polite">
          {INTRO_LINES.slice(0, shown).map((line, i) => (
            <motion.li
              key={line}
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={i < 2 ? 'text-4xl leading-tight font-extrabold' : 'text-xl font-medium opacity-95'}
            >
              {line}
            </motion.li>
          ))}
        </ul>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: shown >= 2 ? 1 : 0 }} transition={{ duration: 0.5 }} className="mt-12">
          <button
            type="button"
            onClick={onStart}
            className="min-h-14 w-full rounded-full bg-white text-lg font-extrabold text-accent-deep shadow-lg active:scale-[0.97]"
          >
            Iniciar ▶
          </button>
        </motion.div>
      </div>
    </main>
  );
}

const HOWTO: { emoji: string; title: string; text: string }[] = [
  { emoji: '🃏', title: 'Tu carta', text: 'Recibes un personaje secreto. No le enseñes tu carta a nadie.' },
  { emoji: '🔎', title: 'Tus rasgos', text: 'Tu carta trae 5 rasgos. Platica y búscalos en otras personas: si alguien comparte uno de tus rasgos, es tu aliado.' },
  { emoji: '🎣', title: 'Phishing', text: 'Hay infiltrados que fingen ser de un grupo. Sus rasgos casi cuadran… pero algo no encaja.' },
  { emoji: '🗳️', title: 'Votación', text: 'Cuando se abra, vota una vez por quien creas que es phishing. A quien votan le baja la vida y pasa a auditor, sin salir del juego.' },
  { emoji: '🛟', title: 'Rescate y vida', text: 'Tu barra de vida empieza en 100. Responde bien la pregunta rescate de cada sección para recuperar vida.' },
];

/** "Cómo se juega": after the intro, and again from the ? button. */
function HowTo({ onDone, overlay = false }: { onDone: () => void; overlay?: boolean }) {
  const body = (
    <div className="mx-auto w-full max-w-md">
      <h1 id="cc-howto" className="text-3xl">
        Cómo se <span className="text-brand">juega</span>
      </h1>
      <ol className="mt-5 flex flex-col gap-3">
        {HOWTO.map((h, i) => (
          <motion.li
            key={h.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i }}
            className="panel flex gap-3 rounded-2xl p-4"
          >
            <span aria-hidden="true" className="text-3xl">
              {h.emoji}
            </span>
            <span>
              <strong className="block text-ink">{h.title}</strong>
              <span className="text-sm">{h.text}</span>
            </span>
          </motion.li>
        ))}
      </ol>
      <Button className="mt-6 w-full" onClick={onDone} sfx="confirm">
        Entendido
      </Button>
    </div>
  );
  if (!overlay) return <main className="screen-in flex min-h-dvh flex-col justify-center px-4 py-8">{body}</main>;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cc-howto" className="fixed inset-0 z-50 overflow-y-auto bg-ground px-4 py-8">
      {body}
    </div>
  );
}

/** The character as a board-game card; it starts face down the first time. */
function RoleCard({ code, view }: { code: string; view: PlayerView }) {
  const { me } = view;
  const def = ROLES[me.role];
  const pistas = pistasFor(me.role, me.decoy);
  const [flipped, setFlipped] = useState(() => !!ccStore.get(`flipped:${code}`));
  const flip = () => {
    setFlipped(true);
    ccStore.set(`flipped:${code}`, '1');
  };
  const group =
    me.role === 'phishing'
      ? `Finge ser del ${GROUP_LABEL[me.decoy ?? 'comercio']}`
      : def.grupo
        ? GROUP_LABEL[def.grupo]
        : 'Sin grupo';

  return (
    <div className="[perspective:1400px]">
      <motion.div
        className="relative [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* Back of the card */}
        <button
          type="button"
          onClick={flip}
          aria-hidden={flipped}
          tabIndex={flipped ? -1 : 0}
          className={`${flipped ? 'pointer-events-none absolute inset-0' : 'relative'} block w-full [backface-visibility:hidden]`}
        >
          <div className="rounded-[1.75rem] bg-brand p-2.5 shadow-brand">
            <div className="hud flex min-h-[26rem] flex-col items-center justify-center rounded-[1.35rem] border-4 border-white/60 p-6 text-center">
              <span aria-hidden="true" className="text-7xl">🃏</span>
              <p className="mt-4 text-3xl font-extrabold">Código Clip</p>
              <p className="mt-2 text-lg opacity-95">Toca para voltear tu carta</p>
            </div>
          </div>
        </button>
        {/* Face of the card */}
        <section
          aria-labelledby="cc-role"
          aria-hidden={!flipped}
          className={`${flipped ? 'relative' : 'pointer-events-none absolute inset-0'} [backface-visibility:hidden] [transform:rotateY(180deg)]`}
        >
          <div className="rounded-[1.75rem] bg-brand p-2.5 shadow-brand">
            <div className="relative rounded-[1.35rem] border-4 border-white/70 bg-panel p-5">
              <span className="absolute top-3 left-4 text-lg font-extrabold text-accent-deep">{me.num}</span>
              <span className="absolute top-3 right-4 text-lg font-extrabold text-accent-deep">{me.num}</span>
              <div className="mx-auto mt-3 grid h-28 w-28 place-items-center rounded-full bg-accent-soft text-6xl shadow-brand-soft" aria-hidden="true">
                {def.emoji}
              </div>
              <p className="eyebrow mt-3 text-center">Tu personaje · secreto</p>
              <h1 id="cc-role" className="mt-1 text-center text-2xl">
                {def.nombre}
              </h1>
              <p className="mt-1 text-center">
                <span className="rounded-full bg-inverse px-3 py-1 text-xs font-bold text-white">{group}</span>
              </p>
              <p className="mt-3 text-center text-sm">{def.descripcion}</p>
              <h2 className="mt-5 text-center text-base">Tus 5 rasgos</h2>
              <ol className="mt-2 flex flex-col gap-2">
                {pistas.map((p, i) => (
                  <li key={p.id} className="flex gap-2 rounded-2xl border border-accent-line bg-accent-soft/60 p-3 text-sm text-ink">
                    <strong className="text-accent-deep">{i + 1}.</strong>
                    <span>{p.texto}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-center text-xs text-ink-dim">
                {me.role === 'phishing'
                  ? 'Usa tus rasgos para parecer del grupo. Que nadie te descubra.'
                  : 'Busca estos rasgos en otras personas: quien comparta uno es tu aliado.'}
              </p>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function Game({ code, token, view }: { code: string; token: string; view: PlayerView }) {
  const { me, session } = view;
  const section = SECTIONS[session.section];
  const auditors = view.roster.filter((r) => r.auditor);
  const [help, setHelp] = useState(false);

  return (
    <Shell>
      <header className="hud -mx-4 -mt-6 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] uppercase opacity-90">Eres el</p>
            <p data-testid="cc-me-num" className="text-3xl font-extrabold">
              Jugador {me.num}
            </p>
          </div>
          <div className="flex items-center gap-3 text-right text-sm">
            <p className="font-semibold">{section.titulo}</p>
            <button
              type="button"
              onClick={() => setHelp(true)}
              aria-label="Cómo se juega"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg font-extrabold text-accent-deep"
            >
              ?
            </button>
          </div>
        </div>
        {session.pointsOn && (
          <div className="mt-3" data-testid="cc-life" data-life={me.life}>
            <ScoreBar points={me.life} color={lifeColor(me.life)} size="sm" onBrand label="Tu vida" />
          </div>
        )}
      </header>

      {me.auditor && (
        <p className="rounded-2xl bg-[#eff6ff] p-4 text-sm font-semibold text-[var(--cc-ally)]">
          🔍 Te votaron: ahora eres <strong>auditor</strong>. Sigues jugando y tienes tu propia pregunta rescate.
        </p>
      )}

      <RoleCard code={code} view={view} />

      {session.roundOpen && (
        <p className="rounded-2xl bg-accent-soft p-4 font-semibold text-accent-deep">
          💬 Ronda de preguntas: platica y busca a quien comparta tus rasgos.
        </p>
      )}
      {session.voteOpen && <VotePanel code={code} token={token} view={view} />}
      <RescuePanel code={code} token={token} view={view} />
      {session.saleOpen && <SalePanel code={code} token={token} view={view} />}

      {auditors.length > 0 && (
        <section className="card p-5">
          <h2 className="text-lg">Auditores</h2>
          <p className="mt-1 text-xs">Quienes ya fueron votados. Siguen jugando.</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {auditors.map((a) => (
              <li key={a.num}>
                Jugador {a.num}: {a.wasPhishing ? <strong className="text-[var(--cc-threat)]">era phishing 🎣</strong> : 'no era phishing'}
              </li>
            ))}
          </ul>
        </section>
      )}
      <AnimatePresence>{help && <HowTo overlay onDone={() => setHelp(false)} />}</AnimatePresence>
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
          <p className="mt-1 text-sm">Para qué sirve: señalar a quien crees que es phishing. Un voto por ronda y no se cambia; a quien votan le baja la vida.</p>
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
          <p className="mt-1 text-sm">Para qué sirve: recuperar vida. Una por sección; si aciertas, +15 de vida.</p>
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
        <p className="mt-1">Para qué sirve: practicar cómo explicar el valor de Clip. Busca a un merchant y convéncelo; él decide en su celular.</p>
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
      <p className="mt-1 text-sm">Para qué sirve: decidir si el vendedor te convenció. Marca lo que sí hizo.</p>
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
