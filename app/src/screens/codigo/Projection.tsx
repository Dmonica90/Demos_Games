import { AnimatePresence, motion } from 'framer-motion';
import { SECTIONS } from '../../codigo/content';
import { useBoard } from '../../codigo/hooks';
import { Brand, ScoreBar } from '../../components/game';
import { QrCard, lifeColor } from './shared';

/**
 * The screen everyone sees (projector or a shared window in Meet): the QR as a
 * game card, the current section, and the ranking with each person's life
 * bar. No roles, votes or answers: those stay on the host's control panel.
 */
export function Projection({ code }: { code: string }) {
  const { data: board, error } = useBoard(code);
  if (board === undefined) return <p className="p-10 text-center">{error ? `No se pudo cargar: ${error}` : 'Cargando…'}</p>;
  if (board === null) return <p className="p-10 text-center">No existe la sesión {code}.</p>;
  const s = board.session;
  if (s.status === 'cerrada')
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="card p-10 text-center">
          <h1 className="text-4xl">¡Gracias por jugar! 🎉</h1>
          <p className="mt-3 text-lg">La sesión terminó.</p>
        </div>
      </main>
    );
  const section = SECTIONS[s.section];
  const banner = s.voteOpen
    ? `🗳️ Votación abierta · ${board.voted} de ${board.players.length} votaron`
    : s.saleOpen
      ? '🤝 Ronda de aliados: ¿quién es de tu equipo?'
      : s.roundOpen
        ? '💬 Ronda de preguntas: busca a quien comparta tus rasgos'
        : null;

  return (
    <main className="mx-auto grid min-h-dvh max-w-[90rem] gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start">
      <aside className="flex flex-col gap-4">
        <QrCard code={code} />
      </aside>
      <section className="flex min-w-0 flex-col gap-5">
        <header className="hud rounded-[var(--radius-card)] px-6 py-5">
          <p className="text-xs font-bold tracking-[0.16em] uppercase opacity-90">
            Sección {s.section + 1} de {SECTIONS.length}
          </p>
          <h1 data-testid="cc-screen-section" className="mt-1 text-3xl !text-white sm:text-5xl">
            {section.titulo}
          </h1>
          <AnimatePresence>
            {banner && (
              <motion.p
                key={banner}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-lg font-semibold"
              >
                {banner}
              </motion.p>
            )}
          </AnimatePresence>
        </header>

        <div className="card p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <Brand label="Ranking · barras de vida" />
            <p className="text-sm text-ink-dim">{board.players.length} jugando</p>
          </div>
          {board.players.length === 0 ? (
            <p className="mt-4 text-lg text-ink-dim">Escanea el QR para entrar al juego.</p>
          ) : (
            <ol data-testid="cc-ranking" className="mt-4 flex flex-col gap-3">
              {board.players.map((p, i) => (
                <motion.li
                  key={p.num}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="grid grid-cols-[2.5rem_minmax(0,14rem)_minmax(0,1fr)] items-center gap-3"
                  data-life={p.life}
                >
                  <span className="text-xl font-extrabold text-ink-dim">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-bold text-ink">{p.name}</span>
                    {p.auditor && (
                      <span className="block text-xs font-bold text-[var(--cc-ally)]">
                        🔍 Auditor · {p.wasPhishing ? 'era phishing 🎣' : 'no era phishing'}
                      </span>
                    )}
                  </span>
                  <ScoreBar points={p.life} color={lifeColor(p.life)} label={`Vida de ${p.name}`} />
                </motion.li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </main>
  );
}
