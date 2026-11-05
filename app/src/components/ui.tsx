import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useSound } from '../audio/SoundProvider';
import type { SfxName } from '../assets';

type ButtonTone = 'primary' | 'ghost' | 'danger' | 'quiet';

const TONES: Record<ButtonTone, string> = {
  primary:
    'bg-brand text-white font-bold hover:-translate-y-0.5 hover:shadow-brand active:translate-y-0 active:scale-[0.97] disabled:bg-none disabled:bg-[#cbd5e1] disabled:text-[#475569] disabled:shadow-none disabled:translate-y-0',
  ghost:
    'bg-panel text-ink font-semibold border-2 border-edge hover:border-accent hover:text-accent-deep active:scale-[0.97]',
  danger: 'bg-alarm-ink text-white font-bold hover:-translate-y-0.5 active:scale-[0.97]',
  quiet: 'bg-transparent text-ink-dim hover:text-ink border border-transparent hover:border-edge',
};

export function Button({
  children,
  onClick,
  tone = 'primary',
  sfx = 'click',
  disabled,
  className = '',
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: ButtonTone;
  sfx?: SfxName | null;
  disabled?: boolean;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'className'>) {
  const { play } = useSound();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (sfx) play(sfx);
        onClick?.();
      }}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 py-3 text-base transition-all duration-200 disabled:cursor-not-allowed ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Staggered entrance for a list of cards. Renders an `<ol>`/`<ul>` when asked,
 * so a list of items stays a real list for screen readers.
 */
export function Stagger({
  children,
  delay = 0,
  as = 'div',
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'ol' | 'ul';
  className?: string;
}) {
  const Tag = motion[as];
  return (
    <Tag
      initial="hidden"
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.09, delayChildren: delay } } }}
      className={className}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
}) {
  const Tag = motion[as];
  return (
    <Tag
      variants={{ hidden: { opacity: 0, y: 18 }, shown: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Modal dialog with focus trapping and Escape-to-close. */
export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }
      if (event.key !== 'Tab' || !node) return;

      const focusable = [
        ...node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-inverse/50 p-4 backdrop-blur-sm">
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="card w-full max-w-lg p-6 sm:p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
