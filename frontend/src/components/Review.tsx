import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { ProposedAction } from '../types';
import { Badge, Button, Card } from './ui';

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
    <div className="min-h-screen flex flex-col max-w-md mx-auto px-6 py-8">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-white mb-8 self-start transition-colors"
      >
        <ArrowLeft size={16} /> Back to chat
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck size={16} className="text-[var(--color-sui)]" />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Review before confirming</span>
        </div>

        <Card className="p-6 mb-6" glow="sui">
          <div className="text-center mb-6">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Amount</div>
            <div className="text-4xl font-bold font-mono">{action.amount} <span className="text-2xl text-[var(--color-text-tertiary)]">SUI</span></div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-[var(--color-border)]">
            <Row label="To" value={action.recipient ?? '—'} />
            <Row label="Purpose" value={action.purpose ?? '—'} />
            <Row label="Network" value={<Badge tone="sui">{action.network}</Badge>} />
          </div>
        </Card>

        <Card className="p-4 mb-6 bg-[var(--color-ai-dim)] border-[var(--color-ai)]/20">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">AI understood</div>
          <div className="text-sm">"{action.summary}"</div>
        </Card>

        <div className="flex flex-col gap-2.5">
          <Button fullWidth onClick={onConfirm}>
            Confirm & Send
          </Button>
          <Button fullWidth variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
