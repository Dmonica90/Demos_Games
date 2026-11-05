import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { COLOR_BG, COLOR_SHORT, ScoreBar } from '../../components/game';
import { Button } from '../../components/ui';
import { finalScore } from '../../engine/conversation';
import { colorCounts } from '../../engine/analysis';
import { formatClock, remainingMs, useNow } from '../../hooks';
import { transport } from '../../realtime';
import type { HostProps } from './props';

/** Live view for the room: one bar per person, sorted as they would rank now. */
export function Dashboard({ session, def, players, hostKey }: HostProps) {
  const now = useNow(500);
  const left = remainingMs(session, now);
  const done = players.filter((p) => p.convo?.done).length;
  const counts = colorCounts(players);
  const finishing = useRef(false);

  const finish = async () => {
    if (!hostKey || finishing.current) return;
    finishing.current = true;
    await transport.setStatus(session.code, hostKey, 'finished').catch(() => (finishing.current = false));
  };

  // Close by itself when time is up or when everyone has finished.
  useEffect(() => {
    if (left === 0 || (players.length > 0 && done === players.length)) {
      const id = setTimeout(() => void finish(), left === 0 ? 1500 : 2500);
      return () => clearTimeout(id);
    }
  });

  const sorted = [...players].sort(
    (a, b) => (b.convo ? finalScore(b.convo) : -1) - (a.convo ? finalScore(a.convo) : -1) || a.joinedAt - b.joinedAt,
  );

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="hud px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-white/85 uppercase">
              Caso {def.number} · Sesión {session.code}
            </p>
            <h1 className="text-3xl !text-white">{def.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(['green', 'yellow', 'red'] as const).map((c) => (
              <span key={c} className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                <span aria-hidden="true" className={`h-3 w-3 rounded-full ring-2 ring-white ${COLOR_BG[c]}`} />
                {COLOR_SHORT[c]} <strong className="text-base">{counts[c]}</strong>
              </span>
            ))}
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
              ✔ Terminaron{' '}
              <strong className="text-base tabular-nums">
                {done}/{players.length}
              </strong>
            </span>
            <span className="rounded-full bg-white px-5 py-2 text-ink">
              <span className="sr-only">Tiempo restante </span>
              <span aria-hidden="true">⏱ </span>
              <strong
                data-testid="clock"
                className={`text-2xl font-extrabold tabular-nums ${left < 60_000 ? 'text-alarm-ink' : ''}`}
              >
                {formatClock(left)}
              </strong>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-8">
      <ol className="grid gap-3" aria-label="Participantes">
        {sorted.map((p, i) => {
          const c = p.convo;
          return (
            <motion.li
              key={p.id}
              layout
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              className="panel grid grid-cols-[2.25rem_minmax(6rem,12rem)_1fr_auto] items-center gap-3 rounded-2xl px-4 py-3 sm:gap-5"
              data-testid={`row-${p.nickname}`}
              data-color={c?.color ?? 'none'}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                  i < 3 ? 'bg-brand text-white' : 'bg-panel-2 text-ink-dim'
                }`}
              >
                {i + 1}
              </span>
              <span className="truncate font-bold text-ink">{p.nickname}</span>
              <ScoreBar points={c?.points ?? 100} color={c?.color ?? 'green'} label={`Barra de ${p.nickname}`} />
              <span className="flex w-36 items-center justify-end gap-3 text-sm tabular-nums">
                <span className="text-lg font-extrabold text-ink">{c?.points ?? 100}</span>
                <span className="text-ink-dim">
                  {!c
                    ? 'conectando'
                    : c.done
                      ? c.mission
                        ? '✓ acuerdo'
                        : c.turn === 0
                          ? '✗ sin respuesta'
                          : '✗ sin acuerdo'
                      : `turno ${c.turn + 1}/${def.maxTurns}`}
                </span>
              </span>
            </motion.li>
          );
        })}
      </ol>

      {hostKey && (
        <div className="mt-auto flex justify-end pt-8">
          <Button tone="ghost" onClick={finish}>
            Terminar y ver resultados
          </Button>
        </div>
      )}
      </div>
    </main>
  );
}
