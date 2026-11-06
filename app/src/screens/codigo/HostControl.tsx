import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DECOY_INDIVIDUAL, DECOY_SHARED, GROUP_LABEL, ROLES, SALE_CRITERIA, SECTIONS, SHARED } from '../../codigo/content';
import type { Estado, Pista } from '../../codigo/content';
import { ccStore, useHostView } from '../../codigo/hooks';
import { tally } from '../../codigo/roles';
import { cc } from '../../codigo/transport';
import type { CCPlayer, HostView, SessionPatch } from '../../codigo/types';
import { Brand } from '../../components/game';
import { Button, Dialog } from '../../components/ui';
import { ccJoinUrl, go } from '../../router';

type Tab = 'jugadores' | 'votos' | 'rescates' | 'venta' | 'banco';
const TABS: { id: Tab; label: string }[] = [
  { id: 'jugadores', label: 'Jugadores' },
  { id: 'votos', label: 'Votos' },
  { id: 'rescates', label: 'Rescates' },
  { id: 'venta', label: 'Venta' },
  { id: 'banco', label: 'Banco de respuestas' },
];

export const ESTADO_LABEL: Record<Estado, string> = {
  propuesta: 'Propuesta · validar',
  diseño: 'Diseño del juego',
  pendiente: 'Pendiente de fuente',
};
export function EstadoBadge({ estado }: { estado: Estado }) {
  const tone =
    estado === 'pendiente' ? 'bg-[#fefce8] text-[var(--cc-pending)]' : estado === 'diseño' ? 'bg-panel-2 text-ink-dim' : 'bg-accent-soft text-accent-deep';
  return <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold whitespace-nowrap ${tone}`}>{ESTADO_LABEL[estado]}</span>;
}

const label = (p: CCPlayer | undefined) => (p ? `Jugador ${p.num} · ${p.name}` : '—');

/** The host's control room for one session. Real names are only shown here. */
export function HostControl({ code }: { code: string }) {
  const key = ccStore.get(`host:${code}`);
  const { data: view, error } = useHostView(code, key);
  const [tab, setTab] = useState<Tab>('jugadores');
  const [actionError, setActionError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  if (!key)
    return (
      <Centered>
        <h1 className="text-2xl">Esta pantalla es del host</h1>
        <p className="mt-2">Solo el navegador que creó la sesión {code} puede controlarla.</p>
        <a href="#/codigo" className="mt-6 inline-block font-semibold text-accent-deep underline">
          Crear una sesión nueva
        </a>
      </Centered>
    );
  if (error && !view) return <Centered>No se pudo cargar la sesión: {error}</Centered>;
  if (!view) return <Centered>Cargando…</Centered>;

  const s = view.session;
  const run = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };
  const set = (patch: SessionPatch) => run(() => cc.set(code, key, patch));

  if (s.status === 'cerrada')
    return (
      <Centered>
        <h1 className="text-3xl">Sesión cerrada</h1>
        <p className="mt-3">Se borraron los nombres, roles, votos, rescates y ventas. No se guardó ni se exportó nada.</p>
        <Button className="mt-6" onClick={() => go('/')}>
          Volver al menú
        </Button>
      </Centered>
    );

  const section = SECTIONS[s.section];
  const pending = view.rescues.filter((r) => r.status === 'pendiente').length;

  return (
    <main className="mx-auto grid min-h-dvh max-w-[90rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <JoinCard code={code} count={view.players.length} total={s.total} />
        <section className="card p-5">
          <label className="flex items-center justify-between gap-3 font-bold text-ink">
            Puntos por participar
            <input
              type="checkbox"
              role="switch"
              checked={s.pointsOn}
              onChange={(e) => void set({ pointsOn: e.target.checked })}
              className="h-6 w-11 accent-[var(--cc-primary)]"
            />
          </label>
          <p className="mt-2 text-xs">+1 por votar, +1 por pedir rescate, +2 si es correcto, +1 por jugar la venta. Nunca por ganar.</p>
        </section>
        <Button tone="danger" onClick={() => setClosing(true)}>
          Cerrar sesión y borrar datos
        </Button>
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <section className="card p-5 sm:p-6">
          <p className="eyebrow">Sección actual</p>
          <ol className="mt-3 flex flex-wrap gap-2">
            {SECTIONS.map((sec, i) => (
              <li key={sec.id}>
                <button
                  type="button"
                  onClick={() => void set({ section: i, roundOpen: false })}
                  aria-current={i === s.section ? 'step' : undefined}
                  className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                    i === s.section ? 'border-accent bg-accent text-white' : i < s.section ? 'border-accent-line bg-accent-soft text-accent-deep' : 'border-edge text-ink-dim'
                  }`}
                >
                  {i + 1}. {sec.titulo}
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 data-testid="cc-section" className="mr-auto text-2xl sm:text-3xl">
              {section.titulo}
            </h1>
            <Toggle on={s.roundOpen} onClick={() => void set({ roundOpen: !s.roundOpen })} label="Ronda de preguntas" />
            <Toggle
              on={s.voteOpen}
              disabled={!s.voteOpen && s.section < 1}
              onClick={() => void set({ voteOpen: !s.voteOpen })}
              label="Votación"
            />
            <Toggle on={s.saleOpen} onClick={() => void set({ saleOpen: !s.saleOpen })} label="Venta" />
          </div>
          <p className="mt-2 text-sm">
            {section.rescate
              ? `Rescate de ${section.tema}: “${section.rescate.pregunta}”`
              : 'Esta sección no tiene pregunta rescate.'}
            {s.section < 1 && ' La votación se abre después de la primera plática.'}
            {s.voteRound > 0 && ` · Ronda de votación ${s.voteRound}${s.voteOpen ? ' (abierta)' : ''}.`}
          </p>
          {actionError && (
            <p role="alert" className="mt-2 text-sm font-medium text-alarm-ink">
              {actionError}
            </p>
          )}
        </section>

        <nav className="flex flex-wrap gap-2" aria-label="Paneles">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === t.id ? 'bg-inverse text-white' : 'bg-panel text-ink'}`}
            >
              {t.label}
              {t.id === 'rescates' && pending > 0 && <span className="ml-2 rounded-full bg-accent px-2 text-white">{pending}</span>}
            </button>
          ))}
        </nav>

        {tab === 'jugadores' && <Players view={view} />}
        {tab === 'votos' && <Votes view={view} onAuditor={(id, on) => void run(() => cc.setAuditor(code, key, id, on))} />}
        {tab === 'rescates' && <Rescues view={view} onMark={(id, ok) => void run(() => cc.markRescue(code, key, id, ok))} />}
        {tab === 'venta' && <Sales view={view} />}
        {tab === 'banco' && <Bank />}
      </div>

      <Dialog open={closing} onClose={() => setClosing(false)} labelledBy="cc-close-title">
        <h2 id="cc-close-title" className="text-2xl">
          ¿Cerrar la sesión?
        </h2>
        <p className="mt-3">Se borran para siempre los nombres, roles, votos, rescates y ventas. Nadie podrá volver a entrar.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button tone="danger" onClick={() => void run(() => cc.close(code, key)).then(() => setClosing(false))}>
            Sí, cerrar y borrar
          </Button>
          <Button tone="ghost" onClick={() => setClosing(false)}>
            Cancelar
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 text-center">
      <div className="card p-8">{children}</div>
    </main>
  );
}

function Toggle({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <Button tone={on ? 'primary' : 'ghost'} onClick={onClick} disabled={disabled} className="!min-h-10 !px-5 !py-2 !text-sm">
      {on ? `Cerrar ${label.toLowerCase()}` : `Abrir ${label.toLowerCase()}`}
    </Button>
  );
}

function JoinCard({ code, count, total }: { code: string; count: number; total: number }) {
  const url = ccJoinUrl(code);
  const [svg, setSvg] = useState('');
  useEffect(() => {
    void QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c2230', light: '#ffffff' } }).then(setSvg);
  }, [url]);
  return (
    <section className="card flex flex-col items-center p-5 text-center">
      <Brand label="Código Clip · Inducción" />
      <p className="mt-1 font-bold text-ink">Escanea para recibir tu personaje</p>
      <div
        className="mt-3 w-full max-w-[15rem] [&>svg]:h-auto [&>svg]:w-full"
        role="img"
        aria-label={`Código QR para entrar a la sesión ${code}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p data-testid="cc-join-link" className="mt-3 rounded-full bg-panel-2 px-3 py-1 font-mono text-xs break-all text-ink">
        {url.replace(/^https?:\/\//, '')}
      </p>
      <p data-testid="cc-code" className="text-brand mt-2 text-4xl font-extrabold tracking-[0.18em]">
        {code}
      </p>
      <p className="mt-1 text-sm" aria-live="polite">
        <strong className="text-ink">{count}</strong> de {total} registrados
      </p>
    </section>
  );
}

function Players({ view }: { view: HostView }) {
  if (view.players.length === 0) return <Empty>Todavía no entra nadie. Proyecta el QR.</Empty>;
  return (
    <section className="card overflow-x-auto p-2 sm:p-4">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-ink-dim uppercase">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">Nombre (solo host)</th>
            <th className="p-2">Personaje</th>
            <th className="p-2">Grupo</th>
            <th className="p-2">Estado</th>
            {view.session.pointsOn && <th className="p-2 text-right">Puntos</th>}
          </tr>
        </thead>
        <tbody>
          {view.players.map((p) => {
            const def = ROLES[p.role];
            return (
              <tr key={p.id} className="border-t border-edge-soft">
                <td className="p-2 font-bold text-ink">{p.num}</td>
                <td className="p-2 font-semibold text-ink">{p.name}</td>
                <td className="p-2">
                  {def.emoji} {def.nombre}
                </td>
                <td className="p-2">
                  {p.role === 'phishing' ? `Imita a ${GROUP_LABEL[p.decoy ?? 'comercio']}` : def.grupo ? GROUP_LABEL[def.grupo] : 'Sin grupo'}
                </td>
                <td className="p-2">{p.auditor ? <span className="font-bold text-[var(--cc-ally)]">Auditor</span> : 'En juego'}</td>
                {view.session.pointsOn && <td className="p-2 text-right font-bold text-ink">{p.points}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Votes({ view, onAuditor }: { view: HostView; onAuditor: (id: string, on: boolean) => void }) {
  const [round, setRound] = useState(view.session.voteRound);
  useEffect(() => setRound(view.session.voteRound), [view.session.voteRound]);
  if (view.session.voteRound === 0) return <Empty>Aún no hay votaciones. Ábrela después de la primera plática.</Empty>;
  const byId = new Map(view.players.map((p) => [p.id, p]));
  const votes = view.votes.filter((v) => v.round === round);
  const { counts, top } = tally(view.votes, round);
  const ranked = [...counts].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...counts.values());
  const open = view.session.voteOpen && round === view.session.voteRound;

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-xl">Quién votó por quién</h2>
          {Array.from({ length: view.session.voteRound }, (_, i) => i + 1).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === round}
              onClick={() => setRound(r)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${r === round ? 'bg-inverse text-white' : 'bg-panel-2'}`}
            >
              Ronda {r}
            </button>
          ))}
        </div>
        <p className="mt-1 text-sm">
          {votes.length} de {view.players.length} votaron{open ? ' · votación abierta' : ''}.
        </p>
        <ul data-testid="cc-votes" className="mt-3 flex flex-col gap-1.5 text-sm">
          {votes.map((v) => (
            <li key={v.voterId} className="panel rounded-xl px-3 py-2">
              <strong className="text-ink">{label(byId.get(v.voterId))}</strong> → {label(byId.get(v.targetId))}
            </li>
          ))}
          {votes.length === 0 && <li className="text-ink-dim">Nadie ha votado en esta ronda.</li>}
        </ul>
      </div>
      <div className="card p-5">
        <h2 className="text-xl">Más votados</h2>
        <p className="mt-1 text-sm">
          {open
            ? 'Cierra la votación para nombrar auditor.'
            : top.length > 1
              ? 'Hay empate: tú decides a quién nombrar auditor.'
              : 'Quien es votado no sale: pasa a ser auditor y sigue jugando.'}
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {ranked.map(([id, k]) => {
            const p = byId.get(id)!;
            if (!p) return null;
            return (
              <li key={id}>
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{label(p)}</span>
                  <span className="font-extrabold text-ink">{k}</span>
                  {p.auditor ? (
                    <span className="text-sm font-bold">
                      Auditor · {p.role === 'phishing' ? <span className="text-[var(--cc-threat)]">era phishing 🎣</span> : <span className="text-[var(--cc-ally)]">no era phishing</span>}
                    </span>
                  ) : (
                    <Button tone="ghost" disabled={open} onClick={() => onAuditor(id, true)} className="!min-h-9 !px-4 !py-1 !text-sm">
                      Nombrar auditor
                    </Button>
                  )}
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-edge">
                  <div className={`h-full rounded-full ${top.includes(id) ? 'bg-brand' : 'bg-ink-dim'}`} style={{ width: `${(k / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Rescues({ view, onMark }: { view: HostView; onMark: (id: string, ok: boolean) => void }) {
  if (view.rescues.length === 0) return <Empty>Nadie ha pedido rescate todavía.</Empty>;
  const byId = new Map(view.players.map((p) => [p.id, p]));
  const list = [...view.rescues].sort((a, b) => Number(a.status !== 'pendiente') - Number(b.status !== 'pendiente') || b.at - a.at);
  return (
    <ul data-testid="cc-rescues" className="grid gap-3 xl:grid-cols-2">
      {list.map((r) => {
        const sec = SECTIONS[r.section];
        const q = r.auditor ? sec.auditor : sec.rescate;
        return (
          <li key={r.id} className="card p-5">
            <p className="eyebrow">
              {sec.tema}
              {r.auditor && ' · auditor'}
            </p>
            <p className="mt-1 font-bold text-ink">{label(byId.get(r.playerId))}</p>
            <p className="mt-2 text-sm">{q?.pregunta}</p>
            <p className="mt-2 rounded-2xl bg-accent-soft p-3 text-lg font-semibold text-ink">“{r.answer}”</p>
            {q && (
              <p className="mt-2 text-sm">
                <strong>Respuesta esperada:</strong> {q.respuesta} <span className="text-ink-dim">({q.ref})</span> <EstadoBadge estado={q.estado} />
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              {r.status === 'pendiente' ? (
                <>
                  <Button onClick={() => onMark(r.id, true)} className="!min-h-10 !px-5 !py-2 !text-sm">
                    ✓ Correcta
                  </Button>
                  <Button tone="ghost" onClick={() => onMark(r.id, false)} className="!min-h-10 !px-5 !py-2 !text-sm">
                    ✗ Incorrecta
                  </Button>
                </>
              ) : (
                <span className={`font-bold ${r.status === 'correcta' ? 'text-safe-ink' : 'text-alarm-ink'}`}>
                  {r.status === 'correcta' ? '✓ Correcta' : '✗ Incorrecta'}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Sales({ view }: { view: HostView }) {
  const byId = new Map(view.players.map((p) => [p.id, p]));
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="card p-5">
        <h2 className="text-xl">Criterios del merchant</h2>
        <p className="mt-1 text-sm">El vendedor de Clip o de Mi Clip intenta convencer a un merchant. El merchant decide en su celular con estos criterios.</p>
        <ol className="mt-4 flex flex-col gap-2">
          {SALE_CRITERIA.map((c, i) => (
            <li key={c.id} className="panel rounded-2xl p-3 text-ink">
              <strong>{i + 1}.</strong> {c.texto} <span className="text-xs text-ink-dim">({c.ref})</span>
            </li>
          ))}
        </ol>
        <p className="mt-3">
          <EstadoBadge estado="diseño" />
        </p>
      </div>
      <div className="card p-5">
        <h2 className="text-xl">Decisiones</h2>
        {view.sales.length === 0 ? (
          <p className="mt-2 text-sm text-ink-dim">{view.session.saleOpen ? 'Esperando a los merchants…' : 'Abre la venta para empezar.'}</p>
        ) : (
          <ul data-testid="cc-sales" className="mt-3 flex flex-col gap-2">
            {view.sales.map((x) => {
              const seller = byId.get(x.sellerId);
              const notSeller = seller && seller.role !== 'vendedor_clip' && seller.role !== 'vendedor_miclip';
              return (
                <li key={x.id} className="panel rounded-2xl p-3 text-sm">
                  <p>
                    <strong className="text-ink">{label(byId.get(x.merchantId))}</strong> sobre {label(seller)}:{' '}
                    <strong className={x.convinced ? 'text-safe-ink' : 'text-alarm-ink'}>{x.convinced ? 'quedó convencido' : 'no quedó convencido'}</strong>
                    {notSeller && <span className="ml-1 font-bold text-[var(--cc-threat)]">(¡no es vendedor{seller.role === 'phishing' ? ': es phishing' : ''}!)</span>}
                  </p>
                  <p className="mt-1 text-ink-dim">
                    {SALE_CRITERIA.map((c) => `${x.criteria.includes(c.id) ? '✓' : '✗'} ${c.id}`).join('  ·  ')}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function PistaRow({ p }: { p: Pista }) {
  return (
    <li className="panel rounded-2xl p-3 text-sm">
      <p className="font-bold text-ink">{p.texto}</p>
      <p className="mt-1">{p.respuesta}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-dim">
        {p.ref} <EstadoBadge estado={p.estado} />
      </p>
    </li>
  );
}

/** Answers for the facilitator, with their slide. Nothing here is validated as official. */
function Bank() {
  return (
    <section className="flex flex-col gap-5">
      <p className="rounded-2xl bg-[#fefce8] p-4 text-sm text-warn-ink">
        Textos propuestos a partir de la presentación OB (octubre 2026). Ninguno está validado como oficial: revisa la referencia de cada uno.
      </p>
      <div className="grid gap-5 xl:grid-cols-2">
        {(['comercio', 'venta'] as const).map((g) => (
          <div key={g} className="card p-5">
            <h2 className="text-lg">{GROUP_LABEL[g]} · pistas compartidas</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {SHARED[g].map((p) => (
                <PistaRow key={p.id} p={p} />
              ))}
            </ul>
          </div>
        ))}
        {Object.values(ROLES)
          .filter((r) => r.individuales.length > 0)
          .map((r) => (
            <div key={r.id} className="card p-5">
              <h2 className="text-lg">
                {r.emoji} {r.nombre}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {r.individuales.map((p) => (
                  <PistaRow key={p.id} p={p} />
                ))}
              </ul>
            </div>
          ))}
        <div className="card p-5">
          <h2 className="text-lg">🎣 Phishing · señuelos</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {[...DECOY_SHARED, ...DECOY_INDIVIDUAL.comercio, ...DECOY_INDIVIDUAL.venta].map((p) => (
              <PistaRow key={p.id} p={p} />
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-lg">Preguntas rescate</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {SECTIONS.flatMap((sec) =>
              [sec.rescate, sec.auditor].flatMap((q, i) =>
                q ? [<PistaRow key={`${sec.id}-${i}`} p={{ id: '', texto: `${sec.tema}${i ? ' (auditor)' : ''}: ${q.pregunta}`, respuesta: q.respuesta, ref: q.ref, estado: q.estado }} />] : [],
              ),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="card p-6 text-ink-dim">{children}</p>;
}
