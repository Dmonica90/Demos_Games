import { motion } from 'framer-motion';
import type { Color } from '../engine/conversation';

export const COLOR_LABEL: Record<Color, string> = {
  green: 'Comunicación efectiva',
  yellow: 'Fricción o confusión',
  red: 'La conversación se deterioró',
};

export const COLOR_SHORT: Record<Color, string> = { green: 'Verde', yellow: 'Amarillo', red: 'Rojo' };

export const COLOR_BG: Record<Color, string> = { green: 'bg-safe', yellow: 'bg-warn', red: 'bg-alarm' };
export const COLOR_TEXT: Record<Color, string> = { green: 'text-safe-ink', yellow: 'text-warn-ink', red: 'text-alarm-ink' };

/** The communication bar: its length is the points, its colour the state. */
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
  return (
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
        className={`h-full rounded-full ${COLOR_BG[color]} `}
        initial={false}
        animate={{ width: `${Math.max(2, points)}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
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

export function Brand({ className = '' }: { className?: string }) {
  return (
    <p className={`eyebrow ${className}`}>
      Simulador de comunicación escrita
    </p>
  );
}
