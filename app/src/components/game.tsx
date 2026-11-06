import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AnimatedEmoji } from './AnimatedEmoji';
import type { EmojiName } from './AnimatedEmoji';
import type { Color } from '../engine/conversation';

export const COLOR_LABEL: Record<Color, string> = {
  green: 'Comunicación efectiva',
  yellow: 'Fricción o confusión',
  red: 'La conversación se deterioró',
};

export const COLOR_SHORT: Record<Color, string> = { green: 'Verde', yellow: 'Amarillo', red: 'Rojo' };

export const COLOR_BG: Record<Color, string> = { green: 'bg-safe', yellow: 'bg-warn', red: 'bg-alarm' };
export const COLOR_TEXT: Record<Color, string> = { green: 'text-safe-ink', yellow: 'text-warn-ink', red: 'text-alarm-ink' };

const FACE: Record<Color, EmojiName> = { green: 'happy', yellow: 'neutral', red: 'angry' };
const RANK: Record<Color, number> = { green: 0, yellow: 1, red: 2 };

/** The communication bar: its length is the points, its colour the state, and a face says how it feels. */
export function ScoreBar({
  points,
  color,
  size = 'md',
  label,
  onBrand = false,
}: {
  points: number;
  color: Color;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  /** On the gradient HUD the track is translucent white. */
  onBrand?: boolean;
}) {
  const height = { sm: 'h-2.5', md: 'h-4', lg: 'h-6' }[size];
  const face = { sm: 26, md: 34, lg: 42 }[size];
  // A short burst when the bar drops a colour.
  const previous = useRef(color);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (RANK[color] > RANK[previous.current]) setBurst(Date.now());
    previous.current = color;
  }, [color]);
  useEffect(() => {
    if (!burst) return;
    const id = setTimeout(() => setBurst(0), 1400);
    return () => clearTimeout(id);
  }, [burst]);

  return (
    <div className="flex w-full items-center gap-2">
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={points}
        aria-label={label ?? 'Barra de comunicación'}
        aria-valuetext={`${points} puntos, ${COLOR_SHORT[color]}`}
        className={`w-full overflow-hidden rounded-full shadow-[inset_0_2px_4px_0_rgb(15_23_42/0.08)] ${onBrand ? 'bg-white/90' : 'bg-edge'} ${height}`}
      >
        <motion.div
          className={`h-full rounded-full ${COLOR_BG[color]}`}
          initial={false}
          animate={{ width: `${Math.max(2, points)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="relative grid shrink-0 place-items-center" style={{ width: face, height: face }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={color}
            data-face={FACE[color]}
            initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="grid place-items-center"
          >
            <AnimatedEmoji name={FACE[color]} size={face} />
          </motion.span>
        </AnimatePresence>
        {burst > 0 && (
          <span key={burst} className="pointer-events-none absolute -top-3 -right-3">
            <AnimatedEmoji name="boom" size={Math.round(face * 0.8)} />
          </span>
        )}
      </span>
    </div>
  );
}

export function Avatar({ initials, className = '' }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-brand font-bold text-white ${className}`}
    >
      {initials}
    </span>
  );
}

export function Brand({ className = '', label = 'Simulador de comunicación escrita' }: { className?: string; label?: string }) {
  return (
    <p className={`eyebrow ${className}`}>
      {label}
    </p>
  );
}
