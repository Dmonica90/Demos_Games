import { useReducedMotion } from 'framer-motion';
import { useState } from 'react';

/**
 * Google's Noto Animated Emoji (CC BY 4.0), bundled in
 * `public/assets/emoji/` as small animated WebP files. Falls back to the plain
 * emoji when the file cannot load or the person prefers reduced motion.
 */
export const EMOJI = {
  happy: { code: '1f60a', char: '😊' },
  neutral: { code: '1f610', char: '😐' },
  angry: { code: '1f620', char: '😠' },
  boom: { code: '1f4a5', char: '💥' },
} as const;

export type EmojiName = keyof typeof EMOJI;

export function AnimatedEmoji({ name, size = 32, className = '' }: { name: EmojiName; size?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const { code, char } = EMOJI[name];
  if (reduce || failed) {
    return (
      <span aria-hidden="true" className={`inline-block leading-none ${className}`} style={{ fontSize: size * 0.85 }}>
        {char}
      </span>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}assets/emoji/${code}.webp`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      decoding="async"
      onError={() => setFailed(true)}
      className={`inline-block select-none ${className}`}
      draggable={false}
    />
  );
}
