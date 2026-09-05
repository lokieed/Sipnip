import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui';

export function Landing({
  onConnect,
  connecting = false,
}: {
  onConnect: () => void;
  connecting?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow background — subtle, not "cyberpunk" */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.15] blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7C6BFF 0%, #4DA2FF 60%, transparent 80%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg"
      >
        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)]">
          <Sparkles size={13} className="text-[var(--color-ai)]" />
          AI-powered · Built on Sui
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
          Tell it what to do.
          <br />
          <span className="text-[var(--color-text-secondary)]">Sui handles the rest.</span>
        </h1>

        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-9 max-w-md">
          Ask in plain English. Your AI agent prepares the transaction, you approve it,
          and it settles on Sui — instantly, and always with your confirmation.
        </p>

        {/* Connect Wallet Card Container with Spring & Geometric Card Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.1 }}
          whileHover={{ scale: 1.015, borderColor: 'rgba(77, 162, 255, 0.4)' }}
          className="w-full max-w-sm p-5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border-2 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] flex flex-col items-center gap-4 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-ai)]/20 to-[var(--color-sui)]/20 border border-white/10 flex items-center justify-center text-[var(--color-sui)]">
            <Sparkles size={22} className="animate-pulse" />
          </div>

          <div className="text-center">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Connect Sui Wallet</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Supports Slush Wallet and standard Sui extensions
            </p>
          </div>

          <Button
            fullWidth
            onClick={onConnect}
            disabled={connecting}
            icon={connecting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet to Start'}
          </Button>
        </motion.div>

        <div className="flex items-center gap-6 mt-10 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ai)]" />
            AI understands your request
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-sui)]" />
            Sui executes on-chain
          </div>
        </div>
      </motion.div>
    </div>
  );
}
