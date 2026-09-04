import { motion } from 'framer-motion';
import { LogOut, MessageSquare, RefreshCw, Wallet } from 'lucide-react';
import type { ActivityItem, WalletState } from '../types';
import { Badge, Button, Card, StatusDot } from './ui';

export function Dashboard({
  wallet,
  activity,
  onOpenChat,
  onRefreshBalance,
  onDisconnect,
  onConnectWallet,
  walletName,
  balanceLoading = false,
}: {
  wallet: WalletState;
  activity: ActivityItem[];
  onOpenChat: () => void;
  onRefreshBalance?: () => void;
  onDisconnect?: () => void;
  onConnectWallet?: () => void;
  walletName?: string;
  balanceLoading?: boolean;
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

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
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
        <Card
          layoutId="chat-morph-shell"
          className="p-4 mb-6 flex items-center justify-between cursor-pointer hover:border-[var(--color-border-hover)] transition-all"
          onClick={onOpenChat}
        >
          <div className="flex items-center gap-2.5">
            <StatusDot tone="success" />
            <span className="text-sm text-[var(--color-text-secondary)]">AI agent ready</span>
          </div>
          <Button variant="secondary" onClick={onOpenChat} icon={<MessageSquare size={14} />}>
            Ask AI
          </Button>
        </Card>

        {/* Activity */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">Recent Activity</h2>
        </div>

        <div className="flex flex-col gap-2">
          {activity.length === 0 && (
            <Card className="p-6 text-center text-sm text-[var(--color-text-tertiary)]">
              No activity yet — try asking the AI to do something.
            </Card>
          )}
          {activity.map((item) => (
            <Card
              key={item.id}
              className={`p-4 flex items-center justify-between transition-all ${item.txDigest ? 'hover:border-[var(--color-border-hover)] cursor-pointer group' : ''}`}
              onClick={() => {
                if (item.txDigest) {
                  const hash = item.txDigest.startsWith('0x') ? item.txDigest : item.txDigest;
                  window.open(`https://suiscan.xyz/testnet/tx/${hash}`, '_blank');
                }
              }}
            >
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <span>{item.summary}</span>
                  {item.txDigest && (
                    <span className="text-[10px] text-[var(--color-sui)] font-mono group-hover:underline">
                      Suiscan ↗
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5 flex items-center gap-2">
                  <span>{item.timestamp}</span>
                  {item.txDigest && (
                    <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                      {item.txDigest.length > 16 ? `${item.txDigest.slice(0, 10)}...` : item.txDigest}
                    </span>
                  )}
                </div>
              </div>
              <Badge tone={item.status === 'success' ? 'success' : item.status === 'error' ? 'danger' : 'neutral'}>
                {item.status}
              </Badge>
            </Card>
          ))}
        </div>
      </motion.div>

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
