import type { CaseDef } from '../../cases/types';
import { Brand, COLOR_LABEL, COLOR_TEXT, ScoreBar } from '../../components/game';
import type { Conversation } from '../../engine/conversation';
import { criteriaAverages, finalScore } from '../../engine/conversation';
import { CRITERIA } from '../../engine/score';
import { QUADRANT_LABEL } from '../../engine/v2/engine';
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
    <main className="screen-in mx-auto max-w-2xl px-4 py-8">
      <Brand />
      <h1 className="mt-2 text-3xl">
        {convo.mission ? (
          <>
            ¡Misión <span className="text-brand">cumplida</span>, {player.nickname}! 🏁
          </>
        ) : (
          <>Conversación terminada, {player.nickname}</>
        )}
      </h1>
      <p className="mt-2">{END_TEXT[convo.endReason ?? 'time']}</p>
      {convo.quadrant && (
        <p data-testid="quadrant" className="mt-4 rounded-2xl bg-accent-soft p-4 text-accent-deep">
          <strong className="block text-ink">{QUADRANT_LABEL[convo.quadrant].title}</strong>
          {QUADRANT_LABEL[convo.quadrant].text}
        </p>
      )}

      <section className="panel-dark mt-6 grid grid-cols-2 gap-4 rounded-3xl p-6">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">Puntaje final</p>
          <p data-testid="final-score" className="text-5xl font-extrabold text-safe-bright">
            {score}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">Misión</p>
          <p className={`mt-1 text-2xl font-extrabold ${convo.mission ? 'text-safe-bright' : 'text-[#fca5a5]'}`}>
            {convo.mission ? '✔ Acuerdo' : '✗ Sin acuerdo'}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl bg-white p-4 text-ink-body">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-bold tracking-[0.14em] text-ink-dim uppercase">Barra de comunicación</p>
            <p className={`text-sm font-medium ${COLOR_TEXT[convo.color]}`}>{COLOR_LABEL[convo.color]}</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <ScoreBar points={convo.points} color={convo.color} size="lg" />
            <span className="font-extrabold text-ink">{convo.points}</span>
          </div>
        </div>
      </section>

      <section className="card mt-6 p-6">
        <p className="eyebrow">01</p>
        <h2 className="mt-1 text-xl">
          Tu evaluación por <span className="text-brand">criterio</span>
        </h2>
        <ul className="mt-3 grid gap-3">
          {CRITERIA.map((c) => (
            <li key={c.id}>
              <div className="flex justify-between text-sm">
                <span>
                  {c.label} <span className="text-ink-dim">({c.weight}%)</span>
                </span>
                <span className="font-extrabold text-ink">{averages[c.id]}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-edge shadow-[inset_0_2px_4px_0_rgb(15_23_42/0.08)]">
                <div className="bg-brand h-full rounded-full" style={{ width: `${averages[c.id]}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <h3 className="mt-6 text-base">Para la próxima 💡</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {weakest.map((c) => (
            <li key={c.id} className="rounded-2xl bg-accent-soft p-3 text-accent-deep">
              <strong>{c.label}:</strong> {c.tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <p className="eyebrow">02</p>
        <h2 className="mt-1 text-xl">Tu conversación</h2>
        <p className="text-sm text-ink-dim">Lo que el simulador detectó en cada uno de tus mensajes.</p>
        <div className="mt-4">
          <Transcript def={def} convo={convo} showSignals />
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-ink-dim">Mira la pantalla del host para ver el ranking del grupo.</p>
    </main>
  );
}
