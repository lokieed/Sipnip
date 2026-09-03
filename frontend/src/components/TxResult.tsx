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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="mb-6 text-[var(--color-sui)]"
        >
          <Loader2 size={40} />
        </motion.div>
        <div className="text-lg font-semibold mb-1">Executing on Sui...</div>
        <div className="text-sm text-[var(--color-text-tertiary)]">Confirming your transaction on-chain</div>
      </Center>
    );
  }

  if (action.status === 'success') {
    return (
      <Center>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mb-6 text-[var(--color-success)]"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <div className="text-xl font-semibold mb-1">Completed</div>
        <div className="text-sm text-[var(--color-text-secondary)] mb-6">
          {action.amount} SUI sent to {action.recipient}
        </div>

        <Card className="p-4 w-full max-w-xs mb-6 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1.5">
            <span>Transaction Digest</span>
            <span className="text-[10px] text-[var(--color-sui)] font-mono">Sui Testnet</span>
          </div>
          <div className="text-xs font-mono break-all leading-relaxed bg-[var(--color-surface-2)]/60 p-2.5 rounded border border-[var(--color-border)]/50 select-all">
            {action.txDigest}
          </div>
        </Card>

        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              const hash = action.txDigest || '8z3TxMuEyAuCTZvKwz1eAcLyW25ZbYhtcVAAd1P76KmQ';
              window.open(`https://suiscan.xyz/testnet/tx/${hash}`, '_blank');
            }}
          >
            View on Suiscan ↗
          </Button>
          <Button fullWidth onClick={onDone}>Back to Dashboard</Button>
        </div>
      </Center>
    );
  }

  // error state
  return (
    <Center>
      <div className="mb-6 text-[var(--color-danger)]">
        <AlertCircle size={44} />
      </div>
      <div className="text-lg font-semibold mb-1">Something went wrong</div>
      <div className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">
        {action.errorMessage ?? 'The transaction could not be completed.'}
      </div>
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
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
