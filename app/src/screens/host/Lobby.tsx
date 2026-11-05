import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Brand } from '../../components/game';
import { Button } from '../../components/ui';
import { transport } from '../../realtime';
import { joinUrl } from '../../router';
import type { HostProps } from './props';

/** The screen to project: a big QR, the code, and everyone who has joined. */
export function Lobby({ session, def, players, hostKey }: HostProps) {
  const url = joinUrl(session.code);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c2230', light: '#ffffff' } }).then(setSvg);
  }, [url]);

  const startGame = async () => {
    if (!hostKey) return;
    try {
      await transport.setStatus(session.code, hostKey, 'running');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="mx-auto grid min-h-dvh max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
      <section className="panel flex flex-col items-center rounded-3xl p-6 text-center sm:p-10">
        <Brand />
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Escanea para unirte</h1>
        <div
          className="mt-6 w-full max-w-[22rem] [&>svg]:h-auto [&>svg]:w-full"
          role="img"
          aria-label={`Código QR para unirse: ${url}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-6 text-sm text-ink-dim">o entra a</p>
        <p className="mt-1 font-mono text-sm break-all">{url.replace(/\/[A-Z0-9]{5}$/, '')}</p>
        <p className="mt-3 text-sm text-ink-dim">con el código</p>
        <p data-testid="session-code" className="mt-1 font-mono text-5xl font-bold tracking-[0.2em] text-accent">
          {session.code}
        </p>
      </section>

      <section className="flex flex-col">
        <p className="text-sm font-semibold text-accent uppercase">
          Caso {def.number} · {def.relation}
        </p>
        <h2 className="mt-1 text-3xl font-bold sm:text-4xl">{def.title}</h2>
        <p className="mt-3 leading-relaxed text-ink-dim">{def.context}</p>

        <div className="mt-8 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold">Sala de espera</h3>
          <p aria-live="polite" className="text-sm text-ink-dim">
            <strong className="text-2xl text-ink">{players.length}</strong> conectad{players.length === 1 ? 'o' : 'os'}
          </p>
        </div>
        <ul className="mt-3 flex min-h-24 flex-wrap content-start gap-2 rounded-2xl border border-dashed border-edge p-4">
          <AnimatePresence>
            {players.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full bg-accent-soft px-4 py-1.5 font-medium text-accent"
              >
                {p.nickname}
              </motion.li>
            ))}
          </AnimatePresence>
          {players.length === 0 && <li className="text-sm text-ink-dim">Esperando participantes…</li>}
        </ul>
        <p className="mt-3 text-sm text-ink-dim">Todas las personas comienzan con 100 puntos.</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {hostKey ? (
            <Button onClick={startGame} disabled={players.length === 0} sfx="confirm">
              Iniciar actividad
            </Button>
          ) : (
            <p className="text-sm text-ink-dim">Vista de solo lectura: solo el navegador que creó la sesión puede iniciarla.</p>
          )}
          {error && (
            <p role="alert" className="text-sm text-alarm">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
