import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, ProposedAction } from '../types';
import { Badge, Button, GEOMETRIC_SPRING } from './ui';

export function Chat({
  messages,
  onSend,
  onReviewAction,
  onBack,
  aiThinking,
  activeActionId,
  isReviewOpen = false,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onReviewAction: (actionId: string) => void;
  onBack: () => void;
  aiThinking: boolean;
  activeActionId?: string;
  isReviewOpen?: boolean;
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages or thinking state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking]);

  // Focus input on initial mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    if (!input.trim() || aiThinking) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <motion.div
      layoutId="chat-morph-shell"
      layout
      transition={GEOMETRIC_SPRING}
      className="h-[100dvh] sm:h-[86vh] sm:max-h-[820px] flex flex-col max-w-2xl mx-auto w-full bg-[var(--color-surface)] border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl relative pointer-events-auto"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isReviewOpen ? 0.35 : 1,
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, delay: 0.08 }}
        className="flex-1 flex flex-col min-h-0 w-full"
        style={{ pointerEvents: isReviewOpen ? 'none' : 'auto' }}
      >
        {/* Sticky Header with responsive padding and blur */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] backdrop-blur-md bg-[var(--color-surface)]/90">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors py-1 px-1.5 -ml-1.5 rounded-md hover:bg-white/5 active:scale-95"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="h-4 w-[1px] bg-[var(--color-border)]" aria-hidden="true" />
          <div>
            <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <span>AI Agent</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] inline-block" />
              <span>Sui Testnet</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="ai">
            <span className="flex items-center gap-1">
              <Sparkles size={11} /> Gemini 3.5
            </span>
          </Badge>
        </div>
      </header>

      {/* Scrollable Message Stream with generous top/bottom padding */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center text-[var(--color-text-tertiary)] max-w-sm mx-auto px-4">
            <div className="w-11 h-11 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-3 text-[var(--color-ai)] border border-[var(--color-border)]">
              <Sparkles size={20} />
            </div>
            <div className="text-sm font-medium text-[var(--color-text-primary)] mb-1">How can I help you today?</div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Ask to send SUI to contacts, query wallet balances, or create testnet escrows in plain English.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                onClick={() => onSend('Send 1 SUI to Nathan for frontend work')}
                className="text-[11px] bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white px-2.5 py-1 rounded-full border border-[var(--color-border)] transition-colors text-left"
              >
                "Send 1 SUI to Nathan"
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="max-w-[85%] sm:max-w-[80%] rounded-[var(--radius-lg)] rounded-tr-xs bg-white text-[#0A0B0F] px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm leading-relaxed select-text">
                {msg.text}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-w-[92%] sm:max-w-[85%]">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5 text-[var(--color-ai)] shadow-xs">
                    <Sparkles size={12} />
                  </div>
                  <div className="rounded-[var(--radius-lg)] rounded-tl-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed select-text whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>

                {msg.action && (
                  <div className="pl-8 sm:pl-8.5 w-full">
                    <AnimatePresence mode="popLayout">
                      {isReviewOpen && activeActionId === msg.action.id ? (
                        <motion.div
                          key={`action-placeholder-${msg.action.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-[185px] w-full rounded-2xl border-2 border-dashed border-[var(--color-sui)]/30 opacity-40 bg-[var(--color-surface)]/20"
                        />
                      ) : (
                        <ActionCard
                          key={`action-card-${msg.action.id}`}
                          action={msg.action}
                          onReview={() => onReviewAction(msg.action!.id)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* AI Thinking State Transition */}
        <AnimatePresence>
          {aiThinking && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 text-xs text-[var(--color-text-tertiary)] pl-8 sm:pl-8.5 py-1"
            >
              <div className="flex gap-1 items-center">
                <Dot delay={0} />
                <Dot delay={0.18} />
                <Dot delay={0.36} />
              </div>
              <span className="text-[11px] sm:text-xs">AI is understanding your request...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} aria-hidden="true" />
      </main>

      {/* Sticky Bottom Input Area with safe-area support */}
      <footer className="sticky bottom-0 z-10 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-[var(--color-border)] backdrop-blur-md bg-[var(--color-surface)]/90 pb-[max(0.875rem,env(safe-area-inset-bottom))] transition-colors">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 sm:px-3.5 py-2 sm:py-2.5 focus-within:border-[var(--color-border-hover)] focus-within:ring-1 focus-within:ring-[var(--color-border-hover)] transition-all shadow-xs"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your request in plain English..."
            disabled={aiThinking}
            className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none min-w-0"
          />
          <button
            type="submit"
            disabled={!input.trim() || aiThinking}
            aria-label="Send message"
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 transition-all shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </footer>
      </motion.div>
    </motion.div>
  );
}

function ActionCard({
  action,
  onReview,
}: {
  action: ProposedAction;
  onReview: () => void;
}) {
  const isCompleted = action.status === 'success';

  return (
    <motion.div
      layoutId={`action-shell-${action.id}`}
      layout="position"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={GEOMETRIC_SPRING}
      className={`p-4 w-full border-2 rounded-2xl overflow-hidden select-none transition-colors ${
        isCompleted
          ? 'border-emerald-500/35 bg-[var(--color-surface)] shadow-none cursor-default'
          : 'border-[var(--color-sui)]/60 hover:border-[var(--color-sui)] rounded-2xl shadow-[0_0_24px_rgba(77,162,255,0.18)] bg-[var(--color-surface)] cursor-pointer'
      }`}
      onClick={isCompleted ? undefined : onReview}
    >
      <div className="flex items-center justify-between mb-2.5">
        <Badge tone={isCompleted ? 'success' : 'sui'}>
          {isCompleted ? 'Transaction Completed' : 'Proposed Action'}
        </Badge>
        {isCompleted && action.txDigest && (
          <a
            href={`https://suiscan.xyz/testnet/tx/${action.txDigest}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-[var(--color-sui)] font-mono hover:underline flex items-center gap-1"
          >
            Suiscan ↗
          </a>
        )}
      </div>
      <div className="text-xs sm:text-sm font-medium mb-3 leading-snug">{action.summary}</div>
      <div className="flex flex-col gap-1.5 text-xs text-[var(--color-text-secondary)] mb-3.5 bg-[var(--color-surface-2)]/40 p-2.5 rounded-xl border border-[var(--color-border)]/40">
        {action.recipient && (
          <div className="flex justify-between items-center">
            <span>Recipient</span>
            <span className="text-[var(--color-text-primary)] font-medium truncate max-w-[180px]">{action.recipient}</span>
          </div>
        )}
        {action.amount !== undefined && (
          <div className="flex justify-between items-center">
            <span>Amount</span>
            <span className="text-[var(--color-text-primary)] font-mono font-semibold">{action.amount} SUI</span>
          </div>
        )}
        {action.purpose && (
          <div className="flex justify-between items-center">
            <span>Purpose</span>
            <span className="text-[var(--color-text-primary)] truncate max-w-[180px]">{action.purpose}</span>
          </div>
        )}
      </div>
      {isCompleted ? (
        <button
          disabled
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 font-medium text-xs sm:text-sm rounded-[var(--radius-md)] px-4 py-2.5 bg-white/5 text-[var(--color-text-tertiary)] border border-white/10 cursor-not-allowed select-none opacity-60"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] inline-block" />
          <span>Completed & Sent</span>
        </button>
      ) : (
        <Button fullWidth onClick={onReview}>
          Review Transaction
        </Button>
      )}
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] inline-block"
      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
      transition={{ repeat: Infinity, duration: 1.1, delay, ease: 'easeInOut' }}
    />
  );
}
