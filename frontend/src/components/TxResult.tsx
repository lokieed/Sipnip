import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ProposedAction } from '../types';
import { Button, Card } from './ui';

export function TxResult({
  action,
  onDone,
  onRetry,
}: {
  action: ProposedAction;
  onDone: () => void;
  onRetry: () => void;
}) {
  if (action.status === 'processing') {
    return (
      <Center>
        <Card layoutId="action-review-card" className="p-6 w-full max-w-sm mb-6 text-center" glow="sui">
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
          <div className="text-xs font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)]/60 p-2.5 rounded border border-[var(--color-border)]/50">
            {action.amount} SUI → {action.recipient}
          </div>
        </Card>
        <Button variant="ghost" onClick={onDone}>
          Cancel / Back to Dashboard
        </Button>
      </Center>
    );
  }

  if (action.status === 'success') {
    return (
      <Center>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="mb-4 text-[var(--color-success)] flex justify-center"
        >
          <CheckCircle2 size={44} />
        </motion.div>
        <div className="text-xl font-semibold mb-1">
          {action.type === 'escrow' ? 'Escrow Created' : 'Transaction Completed'}
        </div>
        <div className="text-sm text-[var(--color-text-secondary)] mb-6">
          {action.type === 'escrow'
            ? `${action.amount} SUI locked in escrow for ${action.recipientAddress || action.recipient || 'the recipient'}`
            : `${action.amount} SUI sent to ${action.recipient}`}
        </div>

        <Card layoutId="action-review-card" className="p-4 w-full max-w-sm mb-6 overflow-hidden text-left">
          {action.txDigest && (
            <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1.5">
                <span>Transaction Digest</span>
                <span className="text-[10px] text-[var(--color-success)] font-medium">Broadcasted Today</span>
              </div>
              <div className="text-xs font-mono break-all leading-relaxed bg-[var(--color-surface-2)]/60 p-2.5 rounded border border-[var(--color-border)]/50 select-all text-[var(--color-sui)]">
                {action.txDigest}
              </div>
            </div>
          )}

          {action.type === 'escrow' && action.escrowId && (
            <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1.5">Escrow Object ID</div>
              <div className="text-xs font-mono break-all leading-relaxed bg-[var(--color-surface-2)]/60 p-2.5 rounded border border-[var(--color-border)]/50 select-all text-[var(--color-sui)]">
                {action.escrowId}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1.5">
            <span>{action.type === 'escrow' ? 'Escrow Recipient' : 'Recipient Address'}</span>
            <span className="text-[10px] text-[var(--color-sui)] font-mono">Sui Testnet</span>
          </div>
          <div className="text-xs font-mono break-all leading-relaxed bg-[var(--color-surface-2)]/60 p-2.5 rounded border border-[var(--color-border)]/50 select-all mb-3">
            {action.recipientAddress || action.recipient}
          </div>

          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>Amount</span>
            <span className="font-mono font-semibold text-[var(--color-text-primary)]">{action.amount} SUI</span>
          </div>
        </Card>

        <div className="flex flex-col gap-2.5 w-full max-w-sm">
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
      </Center>
    );
  }

  // error state
  return (
    <Center>
      <div className="mb-4 text-[var(--color-danger)] flex justify-center">
        <AlertCircle size={44} />
      </div>
      <div className="text-lg font-semibold mb-1">Something went wrong</div>
      <Card layoutId="action-review-card" className="p-4 w-full max-w-sm mb-6 text-left border-[var(--color-danger)]/30">
        <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Reason</div>
        <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {action.errorMessage ?? 'The transaction could not be completed.'}
        </div>
      </Card>
      <div className="flex flex-col gap-2.5 w-full max-w-sm">
        <Button fullWidth onClick={onRetry}>Try Again</Button>
        <Button fullWidth variant="ghost" onClick={onDone}>Back to Dashboard</Button>
      </div>
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}
