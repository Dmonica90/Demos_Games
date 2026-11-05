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
      <section className="card flex flex-col items-center p-6 text-center sm:p-10">
        <Brand />
        <h1 className="mt-2 text-2xl sm:text-3xl">
          Escanea para <span className="text-brand">unirte</span>
        </h1>
        <div
          className="mt-6 w-full max-w-[22rem] [&>svg]:h-auto [&>svg]:w-full"
          role="img"
          aria-label={`Código QR para unirse a la sesión ${session.code}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-5 text-sm font-medium text-ink">Escanea el QR con la cámara de tu celular 📲</p>
        <p className="mt-4 text-xs font-bold tracking-[0.14em] text-ink-dim uppercase">Código de la sesión</p>
        <p data-testid="session-code" className="text-brand mt-1 text-6xl font-extrabold tracking-[0.18em]">
          {session.code}
        </p>
      </section>

      <section className="flex flex-col">
        <p className="eyebrow">
          Caso {def.number} · {def.relation}
        </p>
        <h2 className="mt-2 text-3xl sm:text-5xl">{def.title}</h2>
        <p className="mt-4 text-lg leading-relaxed">{def.context}</p>

        <div className="mt-8 flex items-baseline justify-between">
          <h3 className="text-lg">Sala de espera</h3>
          <p aria-live="polite" className="text-sm text-ink-dim">
            <strong className="text-brand text-4xl font-extrabold">{players.length}</strong> conectad{players.length === 1 ? 'o' : 'os'}
          </p>
        </div>
        <ul className="mt-3 flex min-h-28 flex-wrap content-start gap-2 rounded-3xl border-2 border-dashed border-accent-line bg-panel/60 p-4">
          <AnimatePresence>
            {players.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full border-2 border-accent-line bg-accent-soft px-4 py-1.5 font-semibold text-accent-deep"
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
              Iniciar actividad 🎬
            </Button>
          ) : (
            <p className="text-sm text-ink-dim">Vista de solo lectura: solo el navegador que creó la sesión puede iniciarla.</p>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-alarm-ink">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
