import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import type { ActivityItem, WalletState } from '../types';
import { TypewriterText } from './Typewriter';
import { Badge, Button, Card, GEOMETRIC_SPRING, StatusDot } from './ui';

export function Dashboard({
  wallet,
  activity,
  onOpenChat,
  onRefreshBalance,
  onDisconnect,
  onConnectWallet,
  walletName,
  isChatOpen = false,
  balanceLoading = false,
  onRefreshActivity,
  activityLoading = false,
  onOpenAllActivity,
  isActivityOpen = false,
}: {
  wallet: WalletState;
  activity: ActivityItem[];
  onOpenChat: () => void;
  onRefreshBalance?: () => void;
  onRefreshActivity?: () => void;
  onDisconnect?: () => void;
  onConnectWallet?: () => void;
  walletName?: string;
  isChatOpen?: boolean;
  balanceLoading?: boolean;
  activityLoading?: boolean;
  onOpenAllActivity?: () => void;
  isActivityOpen?: boolean;
}) {
  const isConnected = wallet.connected && !!wallet.address;
  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : '';

  return (
    <div className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-ai)] to-[var(--color-sui)]" />
          <span className="font-semibold text-sm">Sipnip</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <a
                href={`https://suiscan.xyz/testnet/account/${wallet.address}`}
                target="_blank"
                rel="noreferrer"
                title={`View ${wallet.address} on Suiscan`}
                className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-white bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-full px-3 py-1.5 transition-colors"
              >
                <Wallet size={13} />
                <span className="font-mono">{shortAddress}</span>
                {walletName && (
                  <span className="text-[10px] bg-[var(--color-surface-2)] text-[var(--color-sui)] px-1.5 py-0.5 rounded-full font-medium">
                    {walletName}
                  </span>
                )}
              </a>
              {onDisconnect && (
                <button
                  onClick={onDisconnect}
                  title="Disconnect wallet"
                  className="flex items-center text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] p-1.5 rounded-full border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                </button>
              )}
            </>
          ) : (
            <Button onClick={onConnectWallet} icon={<Wallet size={13} />}>
              Connect Slush
            </Button>
          )}
        </div>
      </div>

      <div className="w-full">
        {/* Balance card — 100% Real Live Sui Balance */}
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Balance</span>
              {onRefreshBalance && (
                <button
                  onClick={onRefreshBalance}
                  disabled={balanceLoading}
                  title="Sync balance from Sui Testnet"
                  className="text-[var(--color-text-tertiary)] hover:text-white transition-colors p-1 -m-1 rounded cursor-pointer"
                >
                  <RefreshCw size={12} className={balanceLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            <Badge tone="sui">Sui Testnet</Badge>
          </div>
          <div className="text-4xl font-bold tracking-tight mt-2">
            {balanceLoading || wallet.balance === undefined ? (
              <span className="inline-block w-36 h-9 bg-[var(--color-surface-2)] rounded-md animate-pulse align-middle" />
            ) : (
              <>
                {wallet.balance.toFixed(4)} <span className="text-[var(--color-text-tertiary)] text-2xl">SUI</span>
              </>
            )}
          </div>
        </Card>

        {/* AI agent status — morphs into Chat window */}
        <div className="relative mb-6">
          <div className="h-[68px] w-full rounded-2xl border-2 border-dashed border-white/10 opacity-30 pointer-events-none" />
          <AnimatePresence>
            {!isChatOpen && (
              <motion.div
                key="dashboard-ai-card"
                layoutId="chat-morph-shell"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={GEOMETRIC_SPRING}
                className="absolute inset-0 h-full p-4 flex items-center justify-between cursor-pointer border-2 border-white/20 hover:border-white/40 rounded-2xl shadow-lg bg-[var(--color-surface)] overflow-hidden select-none"
                onClick={onOpenChat}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <StatusDot tone="success" />
                  <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">
                    <span className="text-[var(--color-text-tertiary)] mr-1">Ask:</span>
                    <TypewriterText
                      words={[
                        'Send 1 SUI to Nathan',
                        'Lock 2 SUI in escrow for design',
                        'Transfer 0.05 SUI on Testnet',
                        'Release escrow to Alice',
                        'Check my Sui balance',
                      ]}
                      className="text-white font-medium"
                      typingSpeed={75}
                      deletingSpeed={25}
                      pauseTime={1800}
                    />
                  </div>
                </div>
                <Button variant="secondary" onClick={onOpenChat} icon={<MessageSquare size={14} />}>
                  Ask AI
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sectioned Recent Activity Card — shape morphs into full Activity modal */}
        <div className="relative mb-6">
          {/* Static coordinate placeholder to preserve dashboard layout seamlessly */}
          <div className="w-full rounded-2xl border-2 border-dashed border-white/10 opacity-30 pointer-events-none min-h-[235px]" />
          <AnimatePresence>
            {!isActivityOpen && (
              <motion.div
                key="dashboard-activity-card"
                layoutId="activity-modal-shell"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={GEOMETRIC_SPRING}
                className="absolute inset-0 w-full h-full p-5 flex flex-col justify-start cursor-pointer border-2 border-white/20 hover:border-white/40 rounded-2xl shadow-lg bg-[var(--color-surface)] overflow-hidden select-none group"
                onClick={onOpenAllActivity}
              >
                <motion.div layout="position" className="w-full flex-1 flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                      {activity.length > 0 && (
                        <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          {activity.length}
                        </span>
                      )}
                      {onRefreshActivity && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRefreshActivity();
                          }}
                          disabled={activityLoading}
                          title="Sync recent transactions from Sui Testnet"
                          className="text-[var(--color-text-tertiary)] hover:text-white transition-colors p-1 -m-1 rounded cursor-pointer"
                        >
                          <RefreshCw size={12} className={activityLoading ? 'animate-spin' : ''} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">Live on Sui</span>
                      <span className="text-xs text-[var(--color-sui)] group-hover:underline flex items-center gap-0.5 font-medium">
                        View all <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </div>

                  {/* Preview list (Top 3 items) */}
                  <div className="space-y-2 flex-1">
                    {activity.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--color-text-tertiary)] bg-white/[0.02] rounded-xl border border-white/5">
                        No activity yet — try asking the AI to send SUI.
                      </div>
                    ) : (
                      activity.slice(0, 3).map((item) => {
                        const isReceived = item.summary.toLowerCase().includes('received');
                        const isEscrow = item.summary.toLowerCase().includes('escrow');
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] group-hover:bg-white/[0.06] border border-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  isReceived
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : isEscrow
                                    ? 'bg-purple-500/15 text-purple-400'
                                    : 'bg-[var(--color-sui)]/15 text-[var(--color-sui)]'
                                }`}
                              >
                                {isReceived ? (
                                  <ArrowDownLeft size={13} />
                                ) : isEscrow ? (
                                  <Lock size={12} />
                                ) : (
                                  <ArrowUpRight size={13} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-white truncate">{item.summary}</div>
                                <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono">{item.timestamp}</div>
                              </div>
                            </div>
                            <Badge tone={item.status === 'success' ? 'success' : item.status === 'error' ? 'danger' : 'neutral'}>
                              {item.status}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating chat entry for mobile ergonomics */}
      <button
        onClick={onOpenChat}
        aria-label="Open AI chat"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white text-[#0A0B0F] shadow-[var(--shadow-lg)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <MessageSquare size={20} />
      </button>
    </div>
  );
}
