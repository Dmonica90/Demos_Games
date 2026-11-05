import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { COLOR_SHORT, COLOR_TEXT, ScoreBar } from '../../components/game';
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
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent uppercase">
            Caso {def.number} · {session.code}
          </p>
          <h1 className="text-3xl font-bold">{def.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-ink-dim uppercase">Tiempo</p>
            <p
              data-testid="clock"
              className={`font-mono text-4xl font-bold tabular-nums ${left < 60_000 ? 'text-alarm' : ''}`}
            >
              {formatClock(left)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-dim uppercase">Terminaron</p>
            <p className="font-mono text-4xl font-bold tabular-nums">
              {done}/{players.length}
            </p>
          </div>
        </div>
      </header>

      <ul className="mt-4 flex flex-wrap gap-3 text-sm" aria-label="Estado del grupo">
        {(['green', 'yellow', 'red'] as const).map((c) => (
          <li key={c} className="panel flex items-center gap-2 rounded-full px-4 py-1.5">
            <span className={`font-semibold ${COLOR_TEXT[c]}`}>●</span>
            {COLOR_SHORT[c]}: <strong>{counts[c]}</strong>
          </li>
        ))}
      </ul>

      <ol className="mt-6 grid gap-3" aria-label="Participantes">
        {sorted.map((p, i) => {
          const c = p.convo;
          return (
            <motion.li
              key={p.id}
              layout
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              className="panel grid grid-cols-[2rem_minmax(6rem,12rem)_1fr_auto] items-center gap-3 rounded-2xl px-4 py-3 sm:gap-5"
              data-testid={`row-${p.nickname}`}
              data-color={c?.color ?? 'none'}
            >
              <span className="text-center font-mono text-ink-dim">{i + 1}</span>
              <span className="truncate font-semibold">{p.nickname}</span>
              <ScoreBar points={c?.points ?? 100} color={c?.color ?? 'green'} label={`Barra de ${p.nickname}`} />
              <span className="flex w-36 items-center justify-end gap-3 text-sm tabular-nums">
                <span className="font-mono font-semibold">{c?.points ?? 100}</span>
                <span className="text-ink-dim">
                  {!c
                    ? 'conectando'
                    : c.done
                      ? c.mission
                        ? '✓ acuerdo'
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
    </main>
  );
}
