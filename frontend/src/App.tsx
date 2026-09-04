import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { REAL_WALLET_ADDRESS, executeActionOnSui, fetchWalletBalance, parseIntentWithAI } from './api';
import { Chat } from './components/Chat';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { Review } from './components/Review';
import { TxResult } from './components/TxResult';
import { MOCK_ACTIVITY } from './mock';
import type { ActivityItem, ChatMessage, ProposedAction, WalletState } from './types';

type Screen = 'landing' | 'dashboard' | 'chat' | 'review' | 'result';

export default function App() {
  const [wallet, setWallet] = useState<WalletState>(() => {
    const savedBalance = localStorage.getItem('sipnip_balance');
    const savedConnected = localStorage.getItem('sipnip_connected') === 'true';
    return {
      connected: savedConnected,
      address: REAL_WALLET_ADDRESS,
      balance: savedBalance ? parseFloat(savedBalance) : undefined,
    };
  });

  const [activity, setActivity] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('sipnip_activity');
    return saved ? JSON.parse(saved) : MOCK_ACTIVITY;
  });

  const [screen, setScreen] = useState<Screen>(() => {
    const savedConnected = localStorage.getItem('sipnip_connected') === 'true';
    return savedConnected ? 'dashboard' : 'landing';
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [activeAction, setActiveAction] = useState<ProposedAction | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Sync activity history
  useEffect(() => {
    localStorage.setItem('sipnip_activity', JSON.stringify(activity));
  }, [activity]);

  // Only fetch initial raw blockchain balance if there is NO saved balance yet
  useEffect(() => {
    const saved = localStorage.getItem('sipnip_balance');
    if (!saved) {
      loadRealBalance(true);
    }
  }, []);

  // ---- Wallet connect ----
  const connectWallet = () => {
    setConnecting(true);
    localStorage.setItem('sipnip_connected', 'true');
    setTimeout(() => {
      setWallet((prev) => ({ ...prev, connected: true, address: REAL_WALLET_ADDRESS }));
      setConnecting(false);
      setScreen('dashboard');
    }, 500);
  };

  // ---- Fetch balance from Sui Blockchain (only overwrites if forceSync=true) ----
  const loadRealBalance = async (forceSync = false) => {
    setBalanceLoading(true);
    try {
      const data = await fetchWalletBalance(REAL_WALLET_ADDRESS);
      if (typeof data.balance === 'number') {
        let finalBalance = data.balance;
        if (!forceSync) {
          const saved = localStorage.getItem('sipnip_balance');
          if (saved && !isNaN(parseFloat(saved))) {
            finalBalance = parseFloat(saved);
          }
        }
        setWallet((prev) => ({
          ...prev,
          address: REAL_WALLET_ADDRESS,
          balance: finalBalance,
        }));
        localStorage.setItem('sipnip_balance', finalBalance.toString());
      }
    } catch (err) {
      console.error('Could not load real on-chain balance:', err);
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

      const amountSpent = updated.amount ?? 0;
      const currentSpent = Number(localStorage.getItem('sipnip_spent') || 0);
      const newSpent = currentSpent + amountSpent;
      localStorage.setItem('sipnip_spent', newSpent.toString());

      setWallet((prev) => {
        const current = typeof prev.balance === 'number' ? prev.balance : 5.8851;
        const newBal = Math.max(0, Math.round((current - amountSpent) * 10000) / 10000);
        localStorage.setItem('sipnip_balance', newBal.toString());
        return {
          ...prev,
          balance: newBal,
        };
      });
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
            onRefreshBalance={() => loadRealBalance(true)}
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
