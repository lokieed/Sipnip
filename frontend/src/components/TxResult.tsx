import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ProposedAction } from '../types';
import { Button, GEOMETRIC_SPRING } from './ui';

export function TxResult({
  action,
  onDone,
  onRetry,
}: {
  action: ProposedAction;
  onDone: () => void;
  onRetry: () => void;
}) {
  return (
    <motion.div
      layoutId="action-review-shell"
      layout
      transition={GEOMETRIC_SPRING}
      className="w-full max-w-md bg-[var(--color-surface)] border-2 border-[var(--color-sui)]/60 rounded-2xl p-6 shadow-[0_0_32px_rgba(77,162,255,0.25)] overflow-hidden pointer-events-auto select-none"
    >
      {action.status === 'processing' && (
        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="mb-4 text-[var(--color-sui)] flex justify-center"
          >
            <Loader2 size={38} />
          </motion.div>
          <div className="text-lg font-semibold mb-1">Executing on Sui...</div>
          <div className="text-xs text-[var(--color-text-secondary)] mb-4 max-w-xs mx-auto leading-relaxed">
            Please check your <strong>Slush Wallet</strong> extension popup to approve this transaction.
          </div>
          <div className="text-xs font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)]/60 p-2.5 rounded-xl border border-[var(--color-border)]/50 mb-5 w-full">
            {action.amount} SUI → {action.recipient}
          </div>
          <Button fullWidth variant="ghost" onClick={onDone}>
            Cancel / Back to Dashboard
          </Button>
        </div>
      )}

      {action.status === 'success' && (
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="mb-3 text-[var(--color-success)] flex justify-center"
          >
            <CheckCircle2 size={44} />
          </motion.div>
          <div className="text-xl font-semibold mb-1">
            {action.type === 'escrow' ? 'Escrow Created' : 'Transaction Completed'}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] mb-5">
            {action.type === 'escrow'
              ? `${action.amount} SUI locked in escrow for ${action.recipientAddress || action.recipient || 'the recipient'}`
              : `${action.amount} SUI sent to ${action.recipient}`}
          </div>

          <div className="w-full mb-5 text-left p-3.5 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/60 text-xs">
            {action.txDigest && (
              <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] mb-1">
                  <span>Transaction Digest</span>
                  <span className="text-[10px] text-[var(--color-success)] font-medium">Broadcasted Today</span>
                </div>
                <div className="font-mono break-all leading-relaxed bg-[var(--color-surface-2)] p-2 rounded border border-[var(--color-border)]/50 select-all text-[var(--color-sui)] text-[11px]">
                  {action.txDigest}
                </div>
              </div>
            )}

            {action.type === 'escrow' && action.escrowId && (
              <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
                <div className="text-[11px] text-[var(--color-text-tertiary)] mb-1">Escrow Object ID</div>
                <div className="font-mono break-all leading-relaxed bg-[var(--color-surface-2)] p-2 rounded border border-[var(--color-border)]/50 select-all text-[var(--color-sui)] text-[11px]">
                  {action.escrowId}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] mb-1">
              <span>{action.type === 'escrow' ? 'Escrow Recipient' : 'Recipient Address'}</span>
              <span className="text-[10px] text-[var(--color-sui)] font-mono">Sui Testnet</span>
            </div>
            <div className="font-mono break-all leading-relaxed bg-[var(--color-surface-2)] p-2 rounded border border-[var(--color-border)]/50 select-all mb-3 text-[11px]">
              {action.recipientAddress || action.recipient}
            </div>

            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>Amount</span>
              <span className="font-mono font-semibold text-[var(--color-text-primary)]">{action.amount} SUI</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {action.txDigest && (
              <Button
                fullWidth
                onClick={() => {
                  window.open(`https://suiscan.xyz/testnet/tx/${action.txDigest}`, '_blank');
                }}
              >
                View Transaction on Suiscan ↗
              </Button>
            )}
            <Button fullWidth variant={action.txDigest ? 'secondary' : 'primary'} onClick={onDone}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {action.status === 'error' && (
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 text-[var(--color-danger)] flex justify-center">
            <AlertCircle size={44} />
          </div>
          <div className="text-lg font-semibold mb-1">Something went wrong</div>
          <div className="w-full p-3.5 mb-5 text-left rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-dim)]">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Reason</div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {action.errorMessage ?? 'The transaction could not be completed.'}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Button fullWidth onClick={onRetry}>Try Again</Button>
            <Button fullWidth variant="ghost" onClick={onDone}>Back to Dashboard</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
