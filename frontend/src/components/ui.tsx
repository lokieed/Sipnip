import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ============================================================
// Button (with Morphing Spring Physics & Hover/Tap feedback)
// ============================================================
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium text-sm rounded-[var(--radius-md)] px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-white text-[#0A0B0F] hover:bg-white/90 shadow-[var(--shadow-sm)]',
    secondary:
      'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)]',
    ghost:
      'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]',
    danger:
      'bg-transparent text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger-dim)]',
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.012 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {icon}
      {children}
    </motion.button>
  );
}

// ============================================================
// Card (with PowerPoint-style Shared Layout Morphing)
// ============================================================
export function Card({
  children,
  className = '',
  glow,
  layoutId,
}: {
  children: ReactNode;
  className?: string;
  glow?: 'ai' | 'sui';
  layoutId?: string;
}) {
  const glowStyle =
    glow === 'ai'
      ? { boxShadow: 'var(--shadow-glow-ai)' }
      : glow === 'sui'
      ? { boxShadow: 'var(--shadow-glow-sui)' }
      : {};

  return (
    <motion.div
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] ${className}`}
      style={glowStyle}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// Badge
// ============================================================
type BadgeTone = 'ai' | 'sui' | 'success' | 'warning' | 'danger' | 'neutral';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    ai: 'text-[var(--color-ai)] bg-[var(--color-ai-dim)]',
    sui: 'text-[var(--color-sui)] bg-[var(--color-sui-dim)]',
    success: 'text-[var(--color-success)] bg-[var(--color-success-dim)]',
    warning: 'text-[var(--color-warning)] bg-[var(--color-warning-dim)]',
    danger: 'text-[var(--color-danger)] bg-[var(--color-danger-dim)]',
    neutral: 'text-[var(--color-text-secondary)] bg-[var(--color-surface-2)]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ============================================================
// StatusDot — small pulsing dot for "live" indicators
// ============================================================
export function StatusDot({ tone = 'success' }: { tone?: 'success' | 'warning' | 'danger' }) {
  const colors = {
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[tone]} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[tone]}`} />
    </span>
  );
}
