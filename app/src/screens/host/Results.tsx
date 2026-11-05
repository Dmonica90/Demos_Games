import { useState } from 'react';
import { COLOR_LABEL, COLOR_SHORT, COLOR_TEXT, ScoreBar } from '../../components/game';
import { Button, Dialog } from '../../components/ui';
import { colorCounts, ranking, signalStats } from '../../engine/analysis';
import type { Ranked } from '../../engine/analysis';
import { SIGNAL_LABEL } from '../../engine/signals';
import { QUADRANT_LABEL } from '../../engine/v2/engine';
import { go } from '../../router';
import { Transcript } from '../Transcript';
import type { HostProps } from './props';

const MEDAL = ['🥇', '🥈', '🥉'];

export function Results({ def, players }: HostProps) {
  const ranked = ranking(players);
  const counts = colorCounts(players);
  const { strengths, mistakes } = signalStats(def, players);
  const agreements = ranked.filter((r) => r.convo.mission).length;
  const [open, setOpen] = useState<Ranked | null>(null);
  // Quote each message once, under the first strategy it illustrates.
  const quoted = new Set<string>();
  const topStrengths = strengths.slice(0, 5).map((s) => {
    if (!s.example || quoted.has(s.example.text)) return { ...s, example: undefined };
    quoted.add(s.example.text);
    return s;
  });

  return (
    <main className="screen-in mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Resultados · Caso {def.number}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">
            {def.title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-brand">{def.title.split(' ').slice(-1)}</span>
          </h1>
        </div>
        <Button tone="ghost" onClick={() => go('/')}>
          Nueva sesión
        </Button>
      </header>

      <section aria-label="Resumen" className="panel-dark mt-8 grid gap-6 rounded-3xl p-6 sm:grid-cols-4 sm:p-8">
        <Stat label="Participantes" value={ranked.length} />
        <Stat label="Lograron acuerdo" value={`${agreements}/${ranked.length}`} />
        {(['green', 'red'] as const).map((c) => (
            <Stat key={c} label={`Terminaron en ${COLOR_SHORT[c].toLowerCase()}`} value={counts[c]} tone={c === 'red' ? 'text-[#fca5a5]' : undefined} />
          ))}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section>
          <h2 className="text-2xl">Ranking</h2>
          <p className="text-sm text-ink-dim">
            Puntaje final = 70% barra de comunicación + 30% si logró el acuerdo. Toca a alguien para ver su conversación.
          </p>
          <ol className="mt-4 grid gap-2" aria-label="Ranking">
            {ranked.map((r) => (
              <li key={r.player.id}>
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="panel grid w-full grid-cols-[2.5rem_minmax(0,1fr)_7rem_3rem] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-brand-soft"
                >
                  <span className="text-center text-xl">{MEDAL[r.place - 1] ?? r.place}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{r.player.nickname}</span>
                    <span className="text-xs text-ink-dim">
                      {r.convo.mission ? '✓ Acuerdo' : '✗ Sin acuerdo'} · {r.convo.turn} turnos ·{' '}
                      <span className={COLOR_TEXT[r.convo.color]}>{COLOR_SHORT[r.convo.color]}</span>
                      {r.convo.quadrant && <> · {QUADRANT_LABEL[r.convo.quadrant].title}</>}
                    </span>
                  </span>
                  <ScoreBar points={r.convo.points} color={r.convo.color} size="sm" label={`Barra de ${r.player.nickname}`} />
                  <span className="text-right text-2xl font-extrabold text-ink">{r.score}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid content-start gap-6">
          <section className="card p-6">
            <p className="eyebrow">01</p>
            <h2 className="mt-1 text-xl">
              Estrategias que <span className="text-brand">funcionaron</span>
            </h2>
            {strengths.length === 0 ? (
              <p className="mt-2 text-sm text-ink-dim">Nadie mostró todavía una estrategia efectiva.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {topStrengths.map((s) => (
                  <li key={s.signal}>
                    <p className="font-bold text-ink">
                      {SIGNAL_LABEL[s.signal]}{' '}
                      <span className="text-sm font-normal text-ink-dim">
                        · {s.people} persona{s.people === 1 ? '' : 's'}, {s.withAgreement} con acuerdo
                      </span>
                    </p>
                    {s.example && (
                      <blockquote className="mt-2 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep italic">
                        “{s.example.text}” — {s.example.nickname}
                      </blockquote>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <p className="eyebrow">02</p>
            <h2 className="mt-1 text-xl">
              Errores <span className="text-brand">frecuentes</span>
            </h2>
            {mistakes.length === 0 ? (
              <p className="mt-2 text-sm text-ink-dim">Sin errores frecuentes. ¡Bien hecho!</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {mistakes.slice(0, 5).map((s) => (
                  <li key={s.signal} className="flex items-center justify-between gap-4 rounded-xl border-2 border-edge px-4 py-2">
                    <span className="font-medium text-ink">{SIGNAL_LABEL[s.signal]}</span>
                    <span className="text-sm font-bold text-alarm-ink tabular-nums">
                      {Math.round((s.people / Math.max(1, ranked.length)) * 100)}% del grupo
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <p className="eyebrow">03</p>
            <h2 className="mt-1 text-xl">Qué observar</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {def.observe.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <h2 className="mt-6 text-xl">
              <span className="text-brand">Aprendizajes</span>
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {def.lessons.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <Dialog open={open !== null} onClose={() => setOpen(null)} labelledBy="transcript-title">
        {open && (
          <>
            <h2 id="transcript-title" className="text-2xl">
              {open.player.nickname}
            </h2>
            <p className={`text-sm ${COLOR_TEXT[open.convo.color]}`}>
              {COLOR_LABEL[open.convo.color]} · {open.convo.points} pts · {open.convo.mission ? 'logró acuerdo' : 'sin acuerdo'}
            </p>
            <div className="mt-4 max-h-[60dvh] overflow-y-auto pr-1">
              <Transcript def={def} convo={open.convo} showSignals />
            </div>
            <div className="mt-4 flex justify-end">
              <Button tone="ghost" onClick={() => setOpen(null)}>
                Cerrar
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </main>
  );
}

function Stat({ label, value, tone = '' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">{label}</p>
      <p className={`mt-1 text-5xl font-extrabold ${tone || 'text-safe-bright'}`}>{value}</p>
    </div>
  );
}
