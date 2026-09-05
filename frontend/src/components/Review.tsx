import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { ProposedAction } from '../types';
import { Badge, Button, GEOMETRIC_SPRING } from './ui';

export function Review({
  action,
  onConfirm,
  onCancel,
}: {
  action: ProposedAction;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      layoutId={`action-shell-${action.id}`}
      layout
      transition={GEOMETRIC_SPRING}
      className="w-full max-w-md bg-[var(--color-surface)] border-2 border-[var(--color-sui)]/60 rounded-2xl p-6 shadow-[0_0_32px_rgba(77,162,255,0.25)] overflow-hidden pointer-events-auto select-none"
    >
      <motion.div layout="position" className="w-full">
      {/* Header with Back and Shield */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--color-border)]">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer py-1 px-1.5 -ml-1 rounded hover:bg-white/5 active:scale-95"
        >
          <ArrowLeft size={14} /> Back to chat
        </button>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-sui)]">
          <ShieldCheck size={15} />
          <span>Review Transaction</span>
        </div>
      </div>

      {/* Amount Display */}
      <div className="text-center mb-5">
        <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Total Amount</div>
        <div className="text-4xl font-bold font-mono tracking-tight text-white">
          {action.amount ?? 1} <span className="text-2xl text-[var(--color-text-tertiary)]">SUI</span>
        </div>
      </div>

      {/* Details Box */}
      <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/60 mb-4 text-xs">
        <Row
          label="To"
          value={
            <div className="flex flex-col items-end">
              <span className="font-medium text-white">{action.recipient ?? '—'}</span>
              {action.recipientAddress && (
                <a
                  href={`https://suiscan.xyz/testnet/account/${action.recipientAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[var(--color-sui)] font-mono hover:underline mt-0.5"
                >
                  Verify on Suiscan ↗
                </a>
              )}
            </div>
          }
        />
        <Row label="Purpose" value={action.purpose ?? '—'} />
        <Row label="Network" value={<Badge tone="sui">{action.network || 'Sui Testnet'}</Badge>} />
      </div>

      {/* AI Intent Summary Box */}
      <div className="p-3 rounded-xl mb-5 bg-[var(--color-ai-dim)] border border-[var(--color-ai)]/20 text-xs">
        <span className="text-[var(--color-text-tertiary)] block mb-0.5">AI Intent</span>
        <span className="text-[var(--color-text-primary)] leading-relaxed">"{action.summary}"</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button fullWidth onClick={onConfirm}>
          Confirm & Send
        </Button>
        <Button fullWidth variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs sm:text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
