import { useState } from 'react';
import { COLOR_LABEL, COLOR_SHORT, COLOR_TEXT, ScoreBar } from '../../components/game';
import { Button, Dialog } from '../../components/ui';
import { colorCounts, ranking, signalStats } from '../../engine/analysis';
import type { Ranked } from '../../engine/analysis';
import { SIGNAL_LABEL } from '../../engine/signals';
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent uppercase">
            Resultados · Caso {def.number}
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{def.title}</h1>
        </div>
        <Button tone="ghost" onClick={() => go('/')}>
          Nueva sesión
        </Button>
      </header>

      <section aria-label="Resumen" className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Participantes" value={ranked.length} />
        <Stat label="Lograron acuerdo" value={`${agreements}/${ranked.length}`} />
        {(['green', 'red'] as const).map((c) => (
            <Stat key={c} label={`Terminaron en ${COLOR_SHORT[c].toLowerCase()}`} value={counts[c]} tone={COLOR_TEXT[c]} />
          ))}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section>
          <h2 className="text-xl font-semibold">Ranking</h2>
          <p className="text-sm text-ink-dim">
            Puntaje final = 70% barra de comunicación + 30% si logró el acuerdo. Toca a alguien para ver su conversación.
          </p>
          <ol className="mt-4 grid gap-2" aria-label="Ranking">
            {ranked.map((r) => (
              <li key={r.player.id}>
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="panel grid w-full grid-cols-[2.5rem_minmax(0,1fr)_7rem_3rem] items-center gap-3 rounded-2xl px-4 py-3 text-left hover:border-accent/50"
                >
                  <span className="text-center text-xl">{MEDAL[r.place - 1] ?? r.place}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{r.player.nickname}</span>
                    <span className="text-xs text-ink-dim">
                      {r.convo.mission ? '✓ Acuerdo' : '✗ Sin acuerdo'} · {r.convo.turn} turnos ·{' '}
                      <span className={COLOR_TEXT[r.convo.color]}>{COLOR_SHORT[r.convo.color]}</span>
                    </span>
                  </span>
                  <ScoreBar points={r.convo.points} color={r.convo.color} size="sm" label={`Barra de ${r.player.nickname}`} />
                  <span className="text-right font-mono text-xl font-bold">{r.score}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid content-start gap-6">
          <section className="panel rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-safe">Estrategias que funcionaron</h2>
            {strengths.length === 0 ? (
              <p className="mt-2 text-sm text-ink-dim">Nadie mostró todavía una estrategia efectiva.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {topStrengths.map((s) => (
                  <li key={s.signal}>
                    <p className="font-medium">
                      {SIGNAL_LABEL[s.signal]}{' '}
                      <span className="text-sm font-normal text-ink-dim">
                        · {s.people} persona{s.people === 1 ? '' : 's'}, {s.withAgreement} con acuerdo
                      </span>
                    </p>
                    {s.example && (
                      <blockquote className="mt-1 border-l-2 border-safe/50 pl-3 text-sm text-ink-dim italic">
                        “{s.example.text}” — {s.example.nickname}
                      </blockquote>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-alarm">Errores frecuentes</h2>
            {mistakes.length === 0 ? (
              <p className="mt-2 text-sm text-ink-dim">Sin errores frecuentes. ¡Bien hecho!</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {mistakes.slice(0, 5).map((s) => (
                  <li key={s.signal} className="flex items-center justify-between gap-4">
                    <span>{SIGNAL_LABEL[s.signal]}</span>
                    <span className="text-sm text-ink-dim tabular-nums">
                      {Math.round((s.people / Math.max(1, ranked.length)) * 100)}% del grupo
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Qué observar</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {def.observe.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <h2 className="mt-5 text-lg font-semibold">Aprendizajes</h2>
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
            <h2 id="transcript-title" className="text-xl font-bold">
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
    <div className="panel rounded-2xl px-5 py-4">
      <p className="text-xs text-ink-dim uppercase">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
