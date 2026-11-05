import type { CaseDef } from '../../cases/types';
import { Brand, COLOR_LABEL, COLOR_TEXT, ScoreBar } from '../../components/game';
import type { Conversation } from '../../engine/conversation';
import { criteriaAverages, finalScore } from '../../engine/conversation';
import { CRITERIA } from '../../engine/score';
import type { Player } from '../../realtime';
import { Transcript } from '../Transcript';

const END_TEXT = {
  agreement: 'Lograste un acuerdo concreto.',
  turns: 'Se acabaron los mensajes sin un acuerdo concreto.',
  time: 'Se acabó el tiempo antes de cerrar un acuerdo.',
} as const;

/** The participant's own debrief: both results, each criterion, and tips. */
export function Done({ def, player, convo }: { def: CaseDef; player: Player; convo: Conversation }) {
  const averages = criteriaAverages(def, convo);
  const weakest = [...CRITERIA].sort((a, b) => averages[a.id] - averages[b.id]).slice(0, 2);
  const score = finalScore(convo);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Brand />
      <h1 className="mt-2 text-3xl font-bold">
        {convo.mission ? '¡Misión cumplida' : 'Conversación terminada'}, {player.nickname}
        {convo.mission ? '!' : ''}
      </h1>
      <p className="mt-2 text-ink-dim">{END_TEXT[convo.endReason ?? 'time']}</p>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="panel rounded-2xl p-4">
          <p className="text-xs text-ink-dim uppercase">Puntaje final</p>
          <p data-testid="final-score" className="font-mono text-4xl font-bold">
            {score}
          </p>
        </div>
        <div className="panel rounded-2xl p-4">
          <p className="text-xs text-ink-dim uppercase">Misión</p>
          <p className={`text-2xl font-bold ${convo.mission ? 'text-safe' : 'text-alarm'}`}>
            {convo.mission ? '✓ Acuerdo' : '✗ Sin acuerdo'}
          </p>
        </div>
        <div className="panel col-span-2 rounded-2xl p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-ink-dim uppercase">Barra de comunicación</p>
            <p className={`text-sm font-medium ${COLOR_TEXT[convo.color]}`}>{COLOR_LABEL[convo.color]}</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <ScoreBar points={convo.points} color={convo.color} size="lg" />
            <span className="font-mono font-semibold">{convo.points}</span>
          </div>
        </div>
      </section>

      <section className="panel mt-6 rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Tu evaluación por criterio</h2>
        <ul className="mt-3 grid gap-3">
          {CRITERIA.map((c) => (
            <li key={c.id}>
              <div className="flex justify-between text-sm">
                <span>
                  {c.label} <span className="text-ink-dim">({c.weight}%)</span>
                </span>
                <span className="font-mono font-semibold">{averages[c.id]}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${averages[c.id]}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 font-semibold">Para la próxima</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {weakest.map((c) => (
            <li key={c.id}>
              <strong>{c.label}:</strong> {c.tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Tu conversación</h2>
        <p className="text-sm text-ink-dim">Lo que el simulador detectó en cada uno de tus mensajes.</p>
        <div className="mt-4">
          <Transcript def={def} convo={convo} showSignals />
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-ink-dim">Mira la pantalla del host para ver el ranking del grupo.</p>
    </main>
  );
}
