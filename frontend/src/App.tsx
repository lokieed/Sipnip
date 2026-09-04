import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ConnectModal,
  useCurrentAccount,
  useCurrentWallet,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { REAL_WALLET_ADDRESS, fetchWalletBalance, parseIntentWithAI } from './api';
import { Chat } from './components/Chat';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { Review } from './components/Review';
import { TxResult } from './components/TxResult';
import { MOCK_ACTIVITY } from './mock';
import type { ActivityItem, ChatMessage, ProposedAction, WalletState } from './types';

type Screen = 'landing' | 'dashboard' | 'chat' | 'review' | 'result';

export default function App() {
  const currentAccount = useCurrentAccount();
  const currentWallet = useCurrentWallet();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [connectModalOpen, setConnectModalOpen] = useState(false);

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

  // Sync connected account from Slush / Sui wallet extension
  useEffect(() => {
    if (currentAccount?.address) {
      setWallet((prev) => ({
        ...prev,
        connected: true,
        address: currentAccount.address,
      }));
      localStorage.setItem('sipnip_connected', 'true');
      setScreen((prev) => (prev === 'landing' ? 'dashboard' : prev));
      loadRealBalance(true, currentAccount.address);
    }
  }, [currentAccount?.address]);

  // Initial balance load if not yet populated
  useEffect(() => {
    const saved = localStorage.getItem('sipnip_balance');
    if (!saved) {
      loadRealBalance(true, currentAccount?.address || wallet.address);
    }
  }, []);

  // ---- Wallet connect ----
  const connectWallet = () => {
    setConnecting(true);
    // Find Slush or any available Sui wallet extension
    const slushWallet = wallets.find((w) => w.name.toLowerCase().includes('slush'));
    const targetWallet = slushWallet || wallets[0];

    if (targetWallet) {
      connect(
        { wallet: targetWallet },
        {
          onSuccess: () => {
            setConnecting(false);
            setScreen('dashboard');
          },
          onError: (err) => {
            console.warn('Direct wallet connect error:', err);
            setConnecting(false);
            setConnectModalOpen(true);
          },
        }
      );
    } else {
      setConnecting(false);
      setConnectModalOpen(true);
    }
  };

  // ---- Disconnect wallet ----
  const handleDisconnect = () => {
    disconnect();
    localStorage.removeItem('sipnip_connected');
    localStorage.removeItem('sipnip_balance');
    setWallet({
      connected: false,
      address: undefined,
      balance: undefined,
    });
    setScreen('landing');
  };

  // ---- Fetch real live balance from Sui Blockchain GraphQL RPC ----
  const loadRealBalance = async (forceSync = false, targetAddress?: string) => {
    const addressToQuery = targetAddress || currentAccount?.address || wallet.address || REAL_WALLET_ADDRESS;
    setBalanceLoading(true);
    try {
      const data = await fetchWalletBalance(addressToQuery);
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
          address: addressToQuery,
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

  // ---- Confirm -> Real Slush popup & On-Chain Execution -> Success/Error ----
  const handleConfirm = async () => {
    if (!activeAction) return;

    // If Slush is not connected, prompt connect and notify user
    if (!currentAccount) {
      connectWallet();
      setActiveAction({
        ...activeAction,
        status: 'error',
        errorMessage: 'Please connect your Slush wallet before confirming this transaction.',
      });
      setScreen('result');
      return;
    }

    setActiveAction({ ...activeAction, status: 'processing' });
    setScreen('result');

    try {
      let txDigest: string | undefined;

      const tx = new Transaction();
      const amountSui = activeAction.amount || 1;
      const mistAmount = BigInt(Math.floor(amountSui * 1_000_000_000));
      const [coin] = tx.splitCoins(tx.gas, [mistAmount]);

      const targetAddress =
        activeAction.recipientAddress ||
        (activeAction.recipient?.startsWith('0x') ? activeAction.recipient : undefined) ||
        '0xaa0b19013228e2392e075ea7976db60957718c03a53af3073a54cad1c854bb8d';

      tx.transferObjects([coin], targetAddress);
      tx.setSenderIfNotSet(currentAccount.address);

      const activeWallet = currentWallet.currentWallet;

      // 1. Try native Sui Wallet Standard feature (sui:signAndExecuteTransaction)
      const signAndExecuteFeature = (activeWallet?.features as any)?.[
        'sui:signAndExecuteTransaction'
      ]?.signAndExecuteTransaction;

      // 2. Try legacy Sui Wallet Standard feature (sui:signAndExecuteTransactionBlock)
      const signAndExecuteBlockFeature = (activeWallet?.features as any)?.[
        'sui:signAndExecuteTransactionBlock'
      ]?.signAndExecuteTransactionBlock;

      if (signAndExecuteFeature) {
        console.log('Executing via native wallet sui:signAndExecuteTransaction...');
        const res = await signAndExecuteFeature({
          transaction: tx,
          account: currentAccount,
          chain: 'sui:testnet',
        });
        txDigest = res?.digest;
      } else if (signAndExecuteBlockFeature) {
        console.log('Executing via native wallet sui:signAndExecuteTransactionBlock...');
        const res = await signAndExecuteBlockFeature({
          transactionBlock: tx,
          account: currentAccount,
          chain: 'sui:testnet',
        });
        txDigest = res?.digest;
      } else {
        console.log('Executing via dapp-kit signAndExecuteTransaction...');
        const response = await signAndExecuteTransaction({
          transaction: tx,
        });
        txDigest = response?.digest;
      }

      if (!txDigest) {
        throw new Error('No transaction digest was returned by Slush.');
      }

      const updated: ProposedAction = {
        ...activeAction,
        status: 'success',
        txDigest,
      };
      setActiveAction(updated);
      setActivity((prev) => [
        {
          id: updated.id,
          summary: updated.summary,
          status: 'success',
          timestamp: 'Just now',
          txDigest,
        },
        ...prev,
      ]);

      const amountSpent = updated.amount ?? 0;
      const currentSpent = Number(localStorage.getItem('sipnip_spent') || 0);
      const newSpent = currentSpent + amountSpent;
      localStorage.setItem('sipnip_spent', newSpent.toString());

      // Refresh on-chain balance directly from Sui blockchain GraphQL
      setTimeout(() => {
        loadRealBalance(true, currentAccount.address);
      }, 2000);
    } catch (err: any) {
      console.error('Execution error:', err);
      setActiveAction({
        ...activeAction,
        status: 'error',
        errorMessage: err?.message || 'Transaction was rejected in Slush or failed on Sui Testnet.',
      });
    }
  };

  const backToDashboard = () => {
    setActiveAction(null);
    setScreen('dashboard');
  };

  const activeWalletName =
    currentWallet.currentWallet?.name || (currentAccount ? 'Slush' : undefined);

  // ---- Render with fluid screen transitions ----
  return (
    <>
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
              onDisconnect={handleDisconnect}
              onConnectWallet={connectWallet}
              walletName={activeWalletName}
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

      <ConnectModal
        trigger={<button className="hidden" aria-hidden="true" tabIndex={-1} />}
        open={connectModalOpen}
        onOpenChange={(isOpen) => setConnectModalOpen(isOpen)}
      />
    </>
  );
}
