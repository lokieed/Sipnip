import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { executeActionOnSui, fetchWalletBalance, parseIntentWithAI } from './api';
import { Chat } from './components/Chat';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { Review } from './components/Review';
import { TxResult } from './components/TxResult';
import { MOCK_ACTIVITY, MOCK_WALLET } from './mock';
import type { ActivityItem, ChatMessage, ProposedAction, WalletState } from './types';

type Screen = 'landing' | 'dashboard' | 'chat' | 'review' | 'result';

export default function App() {
  const [wallet, setWallet] = useState<WalletState>(() => {
    const saved = localStorage.getItem('sipnip_wallet');
    return saved ? JSON.parse(saved) : MOCK_WALLET;
  });

  const [activity, setActivity] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('sipnip_activity');
    return saved ? JSON.parse(saved) : MOCK_ACTIVITY;
  });

  const [screen, setScreen] = useState<Screen>(() => {
    return wallet.connected ? 'dashboard' : 'landing';
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [activeAction, setActiveAction] = useState<ProposedAction | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Sync wallet state to localStorage so refresh keeps the updated balance
  useEffect(() => {
    localStorage.setItem('sipnip_wallet', JSON.stringify(wallet));
  }, [wallet]);

  // Sync activity history to localStorage
  useEffect(() => {
    localStorage.setItem('sipnip_activity', JSON.stringify(activity));
  }, [activity]);

  // ---- Wallet connect ----
  const connectWallet = () => {
    setConnecting(true);
    setTimeout(() => {
      setWallet((prev) => ({ ...prev, connected: true }));
      setConnecting(false);
      setScreen('dashboard');
      loadRealBalance();
    }, 900);
  };

  // ---- Fetch the REAL balance from your teammate's backend ----
  // If this fails (backend not running, CORS not set up yet, etc.)
  // we just keep the mock balance instead of breaking the screen.
  const loadRealBalance = async () => {
    setBalanceLoading(true);
    try {
      const data = await fetchWalletBalance();
      setWallet((prev) => ({ ...prev, balance: data.balance }));
    } catch (err) {
      console.error('Could not load real balance, keeping mock value:', err);
    } finally {
      setBalanceLoading(false);
    }
  };

  // ---- Chat: user sends a message, real AI responds ----
  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setAiThinking(true);

    try {
      // Map previous messages to simple history for AI context
      const history = messages.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const { message, action } = await parseIntentWithAI(text, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: message,
        action,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', text: 'Sorry, I had trouble processing that request.' },
      ]);
    } finally {
      setAiThinking(false);
    }
  };

  // ---- Review an action proposed in chat ----
  const handleReviewAction = (actionId: string) => {
    const msg = messages.find((m) => m.action?.id === actionId);
    if (msg?.action) {
      setActiveAction(msg.action);
      setScreen('review');
    }
  };

  // ---- Confirm -> processing -> success/error ----
  const handleConfirm = async () => {
    if (!activeAction) return;
    setActiveAction({ ...activeAction, status: 'processing' });
    setScreen('result');

    const result = await executeActionOnSui(activeAction);

    if (result.success) {
      const updated: ProposedAction = { ...activeAction, status: 'success', txDigest: result.digest };
      setActiveAction(updated);
      setActivity((prev) => [
        { id: updated.id, summary: updated.summary, status: 'success', timestamp: 'Just now', txDigest: result.digest },
        ...prev,
      ]);
      setWallet((prev) => ({ ...prev, balance: (prev.balance ?? 0) - (updated.amount ?? 0) }));
    } else {
      setActiveAction({ ...activeAction, status: 'error', errorMessage: result.error });
    }
  };

  const backToDashboard = () => {
    setActiveAction(null);
    setScreen('dashboard');
  };

  // ---- Render with fluid screen transitions ----
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeInOut' }}
        className="w-full min-h-screen"
      >
        {screen === 'landing' && <Landing onConnect={connectWallet} connecting={connecting} />}
        {screen === 'dashboard' && (
          <Dashboard
            wallet={wallet}
            activity={activity}
            onOpenChat={() => setScreen('chat')}
            balanceLoading={balanceLoading}
          />
        )}
        {screen === 'chat' && (
          <Chat
            messages={messages}
            onSend={handleSend}
            onReviewAction={handleReviewAction}
            onBack={() => setScreen('dashboard')}
            aiThinking={aiThinking}
          />
        )}
        {screen === 'review' && activeAction && (
          <Review action={activeAction} onConfirm={handleConfirm} onCancel={() => setScreen('chat')} />
        )}
        {screen === 'result' && activeAction && (
          <TxResult action={activeAction} onDone={backToDashboard} onRetry={handleConfirm} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
