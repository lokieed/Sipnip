import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { Badge, Button, Card } from './ui';

export function Chat({
  messages,
  onSend,
  onReviewAction,
  onBack,
  aiThinking,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onReviewAction: (actionId: string) => void;
  onBack: () => void;
  aiThinking: boolean;
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
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className="h-[100dvh] flex flex-col max-w-2xl mx-auto w-full bg-[var(--color-bg)] rounded-[var(--radius-lg)] overflow-hidden"
    >
      {/* Sticky Header with responsive padding and blur */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] backdrop-blur-md bg-[var(--color-bg)]/80 transition-colors">
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
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-sui)] animate-pulse" />
            </div>
            <div className="text-[11px] sm:text-xs text-[var(--color-text-tertiary)] truncate">
              Sui transaction assistant
            </div>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area with responsive fluid spacing */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-3.5 sm:gap-4 scroll-smooth">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--color-ai-dim)] border border-[var(--color-ai)]/20 flex items-center justify-center mb-3.5 shadow-sm">
              <Sparkles size={18} className="text-[var(--color-ai)]" />
            </div>
            <div className="text-sm font-medium mb-1">What would you like to do?</div>
            <div className="text-xs text-[var(--color-text-tertiary)] max-w-xs">
              Try: <span className="text-[var(--color-text-secondary)]">"Send 5 SUI to Ahmad for design work"</span> or <span className="text-[var(--color-text-secondary)]">"Swap 20 SUI to USDC"</span>
            </div>
          </motion.div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)]/60 text-[var(--color-text-primary)] rounded-[var(--radius-md)] rounded-br-xs px-3.5 sm:px-4 py-2 sm:py-2.5 max-w-[85%] sm:max-w-[78%] text-xs sm:text-sm shadow-xs break-words">
                {msg.text}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[var(--color-ai-dim)] border border-[var(--color-ai)]/25 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles size={13} className="text-[var(--color-ai)]" />
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--color-text-primary)] pt-0.5 leading-relaxed">
                    {msg.text}
                  </div>
                </div>

                {msg.action && (
                  <div className="pl-8 sm:pl-8.5">
                    <ActionCard
                      summary={msg.action.summary}
                      recipient={msg.action.recipient}
                      amount={msg.action.amount}
                      purpose={msg.action.purpose}
                      onReview={() => onReviewAction(msg.action!.id)}
                    />
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
      <footer className="sticky bottom-0 z-10 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-[var(--color-border)] backdrop-blur-md bg-[var(--color-bg)]/85 pb-[max(0.875rem,env(safe-area-inset-bottom))] transition-colors">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 sm:px-3.5 py-2 sm:py-2.5 focus-within:border-[var(--color-border-hover)] focus-within:ring-1 focus-within:ring-[var(--color-border-hover)] transition-all shadow-xs"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={aiThinking ? 'Thinking...' : 'Ask Sipnip to transfer, escrow, or swap...'}
            disabled={aiThinking}
            aria-label="Message to AI agent"
            className="flex-1 bg-transparent text-xs sm:text-sm outline-none placeholder:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}

function ActionCard({
  summary,
  recipient,
  amount,
  purpose,
  onReview,
}: {
  summary: string;
  recipient?: string;
  amount?: number;
  purpose?: string;
  onReview: () => void;
}) {
  return (
    <Card layoutId="action-review-card" className="p-3.5 sm:p-4 w-full transition-all" glow="ai">
      <div className="flex items-center justify-between mb-2.5">
        <Badge tone="ai">Proposed Action</Badge>
      </div>
      <div className="text-xs sm:text-sm font-medium mb-3 leading-snug">{summary}</div>
      <div className="flex flex-col gap-1.5 text-xs text-[var(--color-text-secondary)] mb-3.5 bg-[var(--color-surface-2)]/40 p-2.5 rounded-md border border-[var(--color-border)]/40">
        {recipient && (
          <div className="flex justify-between items-center">
            <span>Recipient</span>
            <span className="text-[var(--color-text-primary)] font-medium truncate max-w-[180px]">{recipient}</span>
          </div>
        )}
        {amount !== undefined && (
          <div className="flex justify-between items-center">
            <span>Amount</span>
            <span className="text-[var(--color-text-primary)] font-mono font-semibold">{amount} SUI</span>
          </div>
        )}
        {purpose && (
          <div className="flex justify-between items-center">
            <span>Purpose</span>
            <span className="text-[var(--color-text-primary)] truncate max-w-[180px]">{purpose}</span>
          </div>
        )}
      </div>
      <Button fullWidth onClick={onReview}>
        Review Transaction
      </Button>
    </Card>
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
