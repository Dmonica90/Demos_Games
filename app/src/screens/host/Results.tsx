import { motion } from 'framer-motion';
import { useState } from 'react';
import { AnimatedEmoji } from '../../components/AnimatedEmoji';
import type { EmojiName } from '../../components/AnimatedEmoji';
import { COLOR_BG, COLOR_LABEL, COLOR_SHORT, COLOR_TEXT } from '../../components/game';
import { Button, Dialog } from '../../components/ui';
import { colorCounts, ranking, signalStats } from '../../engine/analysis';
import type { Ranked } from '../../engine/analysis';
import type { Color } from '../../engine/conversation';
import { SIGNAL_LABEL, SIGNAL_TIP } from '../../engine/signals';
import { go } from '../../router';
import { Transcript } from '../Transcript';
import type { HostProps } from './props';

const MEDAL = ['🥇', '🥈', '🥉'];
/** Height in px of the column area (h-64); a score of 100 fills it. */
const BAR_AREA = 256;
/** Height in px of the medal + name row under the columns. */
const NAME_ROW = 48;
const FACE: Record<Color, EmojiName> = { green: 'happy', yellow: 'neutral', red: 'angry' };

/**
 * For the projector: one column per person (height = final score, colour =
 * their bar, their face on top), and the single most common mistake.
 */
export function Results({ def, players }: HostProps) {
  const ranked = ranking(players);
  const counts = colorCounts(players);
  const { mistakes } = signalStats(def, players);
  const top = mistakes[0];
  const agreements = ranked.filter((r) => r.convo.mission).length;
  const [open, setOpen] = useState<Ranked | null>(null);
  const crowded = ranked.length > 12;

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
        <Stat label="Terminaron en verde" value={counts.green} />
        <Stat label="Terminaron en rojo" value={counts.red} tone="text-[#fca5a5]" />
      </section>

      <section className="card mt-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl">Ranking</h2>
          <p className="text-sm text-ink-dim">
            Puntaje final = 70% barra + 30 si logró el acuerdo (✔). Toca una columna para ver la conversación.
          </p>
        </div>

        <div className={`mt-6 ${crowded ? 'overflow-x-auto pb-2' : ''}`}>
          <div className="relative" style={{ minWidth: crowded ? ranked.length * 76 : undefined }}>
            {/* Y axis guides, over the column area (above the 48px name row). */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-64" style={{ bottom: NAME_ROW }}>
              {[100, 50, 0].map((v) => (
                <div
                  key={v}
                  className="absolute inset-x-0 flex items-center gap-2 border-t border-dashed border-edge"
                  style={{ top: `${100 - v}%` }}
                >
                  <span className="-mt-3 text-[0.65rem] text-ink-dim">{v}</span>
                </div>
              ))}
            </div>

            <ol aria-label="Ranking" className="relative flex items-end gap-3 pl-8 sm:gap-5">
              {ranked.map((r, i) => {
                const label = `${r.player.nickname}, ${r.score} puntos, ${COLOR_SHORT[r.convo.color]}, ${
                  r.convo.mission ? 'con acuerdo' : 'sin acuerdo'
                }`;
                return (
                  <li key={r.player.id} className="flex min-w-14 flex-1 flex-col items-center" style={{ maxWidth: 120 }}>
                    <button
                      type="button"
                      onClick={() => setOpen(r)}
                      aria-label={label}
                      className="group flex w-full flex-col items-center"
                    >
                      {/* Face and score ride on top of the column. */}
                      <span className="flex w-full flex-col items-center justify-end" style={{ height: BAR_AREA + 72 }}>
                        <AnimatedEmoji name={FACE[r.convo.color]} size={crowded ? 28 : 36} />
                        <span className="mt-1 mb-1 text-lg font-extrabold leading-none text-ink">
                          {r.score}
                          {r.convo.mission && <span className="ml-0.5 text-safe-ink">✔</span>}
                        </span>
                        <motion.span
                          initial={{ height: 0 }}
                          animate={{ height: Math.round((Math.max(3, r.score) / 100) * BAR_AREA) }}
                          transition={{ type: 'spring', stiffness: 80, damping: 16, delay: i * 0.08 }}
                          className={`block w-full max-w-16 rounded-t-2xl ${COLOR_BG[r.convo.color]} shadow-sm transition-transform group-hover:-translate-y-1`}
                        />
                      </span>
                      <span className="flex w-full flex-col items-center justify-start pt-1" style={{ height: NAME_ROW }}>
                        <span className="text-lg leading-none">
                          {MEDAL[i] ?? <span className="text-sm text-ink-dim">{i + 1}</span>}
                        </span>
                        <span className="mt-1 w-full truncate text-center text-sm font-bold text-ink">{r.player.nickname}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section className="card mt-8 p-6 sm:p-8" aria-label="El error más común">
        <p className="eyebrow">Análisis del grupo</p>
        <h2 className="mt-1 text-2xl">
          El error más <span className="text-brand">común</span>
        </h2>
        {top ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="rounded-3xl bg-[#fef2f2] px-6 py-5 text-center">
              <p className="text-5xl font-extrabold text-alarm-ink">
                {Math.round((top.people / Math.max(1, ranked.length)) * 100)}%
              </p>
              <p className="text-xs font-semibold text-alarm-ink">del grupo</p>
            </div>
            <div>
              <p data-testid="top-mistake" className="text-xl font-bold text-ink">
                {SIGNAL_LABEL[top.signal]}
              </p>
              {top.example && (
                <blockquote className="mt-2 rounded-2xl bg-panel-2 px-4 py-3 text-sm italic">
                  “{top.example.text}”
                </blockquote>
              )}
              {SIGNAL_TIP[top.signal] && (
                <p className="mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">
                  <strong>En su lugar: </strong>
                  {SIGNAL_TIP[top.signal]}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-lg">¡Nadie cometió errores frecuentes! 🎉</p>
        )}
      </section>

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
