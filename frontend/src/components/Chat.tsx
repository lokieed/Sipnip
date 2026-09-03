import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
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

  const submit = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border)]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="ml-2">
          <div className="text-sm font-medium">AI Agent</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">Can prepare Sui transactions for you</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-[var(--color-text-tertiary)] mt-10">
            Try: <span className="text-[var(--color-text-secondary)]">"Send 5 SUI to Alice for dinner"</span>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="bg-[var(--color-surface-2)] rounded-[var(--radius-md)] px-4 py-2.5 max-w-[80%] text-sm">
                {msg.text}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-[85%]">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-md bg-[var(--color-ai-dim)] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-[var(--color-ai)]" />
                  </div>
                  <div className="text-sm text-[var(--color-text-primary)] pt-0.5">{msg.text}</div>
                </div>

                {msg.action && (
                  <ActionCard
                    summary={msg.action.summary}
                    recipient={msg.action.recipient}
                    amount={msg.action.amount}
                    purpose={msg.action.purpose}
                    onReview={() => onReviewAction(msg.action!.id)}
                  />
                )}
              </div>
            )}
          </motion.div>
        ))}

        <AnimatePresence>
          {aiThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] ml-8"
            >
              <span className="flex gap-1">
                <Dot delay={0} /> <Dot delay={0.15} /> <Dot delay={0.3} />
              </span>
              AI is thinking
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 focus-within:border-[var(--color-border-hover)] transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={aiThinking ? 'Waiting for AI to respond...' : 'Ask the AI to do something...'}
            disabled={aiThinking}
            aria-label="Message to AI agent"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || aiThinking}
            aria-label="Send message"
            className="text-[var(--color-text-secondary)] hover:text-white disabled:opacity-30 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
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
    <Card className="p-4 w-full" glow="ai">
      <div className="flex items-center justify-between mb-3">
        <Badge tone="ai">Proposed Action</Badge>
      </div>
      <div className="text-sm font-medium mb-3">{summary}</div>
      <div className="flex flex-col gap-1.5 text-xs text-[var(--color-text-secondary)] mb-4">
        {recipient && (
          <div className="flex justify-between">
            <span>Recipient</span>
            <span className="text-[var(--color-text-primary)]">{recipient}</span>
          </div>
        )}
        {amount && (
          <div className="flex justify-between">
            <span>Amount</span>
            <span className="text-[var(--color-text-primary)] font-mono">{amount} SUI</span>
          </div>
        )}
        {purpose && (
          <div className="flex justify-between">
            <span>Purpose</span>
            <span className="text-[var(--color-text-primary)]">{purpose}</span>
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
      className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] inline-block"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ repeat: Infinity, duration: 1, delay }}
    />
  );
}
