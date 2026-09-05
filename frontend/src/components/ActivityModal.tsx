import { motion } from 'framer-motion';
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Lock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ActivityItem } from '../types';
import { Badge, GEOMETRIC_SPRING } from './ui';

export function ActivityModal({
  activity,
  onBack,
  onRefresh,
  loading = false,
  walletAddress,
}: {
  activity: ActivityItem[];
  onBack: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  walletAddress?: string;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'escrow'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyDigest = (digest: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(digest);
    setCopiedId(digest);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = useMemo(() => {
    return activity.filter((item) => {
      const text = `${item.summary} ${item.txDigest || ''}`.toLowerCase();
      const matchesSearch = !search.trim() || text.includes(search.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (filter === 'sent') return item.summary.toLowerCase().includes('sent');
      if (filter === 'received') return item.summary.toLowerCase().includes('received');
      if (filter === 'escrow') return item.summary.toLowerCase().includes('escrow');
      return true;
    });
  }, [activity, search, filter]);

  return (
    <motion.div
      layoutId="activity-modal-shell"
      layout
      transition={GEOMETRIC_SPRING}
      className="h-[92dvh] sm:h-[84vh] sm:max-h-[780px] flex flex-col max-w-2xl mx-auto w-full bg-[var(--color-surface)] border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl relative pointer-events-auto select-none"
    >
      <motion.div layout="position" className="flex-1 flex flex-col min-h-0 w-full">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] backdrop-blur-md bg-[var(--color-surface)]/95">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors py-1 px-2 -ml-1 rounded-md hover:bg-white/5 active:scale-95 cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Sync recent on-chain transactions from Sui Testnet"
              className="p-1.5 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[var(--color-sui)]' : ''} />
            </button>
          )}
          <Badge tone="sui">Sui Testnet</Badge>
        </div>
      </header>

      {/* Subheader bar with account info */}
      <div className="px-4 sm:px-6 py-3 bg-[var(--color-surface-2)]/60 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <Activity size={14} className="text-[var(--color-sui)]" />
          <span>
            On-Chain History: <strong className="text-white font-mono">{activity.length}</strong> transactions
          </span>
        </div>
        {walletAddress && (
          <a
            href={`https://suiscan.xyz/testnet/account/${walletAddress}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-[var(--color-sui)] hover:underline flex items-center gap-1.5"
            title="View complete account in Suiscan explorer"
          >
            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 sm:px-6 sm:py-3.5 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by amount, status, or hash..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-white placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-sui)]"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          {(['all', 'sent', 'received', 'escrow'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                filter === t
                  ? 'bg-[var(--color-surface-2)] text-white border border-white/20 shadow-sm'
                  : 'text-[var(--color-text-tertiary)] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Transaction List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-text-tertiary)]">
            {activity.length === 0
              ? 'No transactions found on Sui Testnet for this wallet.'
              : 'No transactions match your search filter.'}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isReceived = item.summary.toLowerCase().includes('received');
            const isEscrow = item.summary.toLowerCase().includes('escrow');

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.txDigest) {
                    window.open(`https://suiscan.xyz/testnet/tx/${item.txDigest}`, '_blank');
                  }
                }}
                className={`p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)] transition-all flex items-center justify-between gap-3 group ${
                  item.txDigest ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon indicator */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isReceived
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isEscrow
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-[var(--color-sui)]/10 text-[var(--color-sui)] border border-[var(--color-sui)]/20'
                    }`}
                  >
                    {isReceived ? (
                      <ArrowDownLeft size={17} />
                    ) : isEscrow ? (
                      <Lock size={16} />
                    ) : (
                      <ArrowUpRight size={17} />
                    )}
                  </div>

                  {/* Summary & metadata */}
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="truncate text-white">{item.summary}</span>
                      {item.txDigest && (
                        <span className="text-[10px] text-[var(--color-sui)] font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Suiscan <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5 flex flex-wrap items-center gap-2 font-mono">
                      <span>{item.timestamp}</span>
                      {item.netDelta && (
                        <>
                          <span>•</span>
                          <span title="Net balance deducted from or credited to your wallet on-chain (matches Suiscan)">
                            Net: <span className="text-white/90 font-medium">{item.netDelta}</span>
                          </span>
                        </>
                      )}
                      {item.gasFee && (
                        <>
                          <span>•</span>
                          <span title="Gas fee paid for this transaction">
                            Gas: <span className="text-white/70">{item.gasFee}</span>
                          </span>
                        </>
                      )}
                      {item.txDigest && (
                        <>
                          <span>•</span>
                          <span
                            title="Click to copy digest"
                            onClick={(e) => copyDigest(item.txDigest!, e)}
                            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-white/5 px-1.5 py-0.5 rounded"
                          >
                            {item.txDigest.slice(0, 8)}...{item.txDigest.slice(-6)}
                            {copiedId === item.txDigest ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 flex items-center gap-2">
                  <Badge tone={item.status === 'success' ? 'success' : item.status === 'error' ? 'danger' : 'neutral'}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/80 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-[var(--color-sui)]" />
            <span>Synced directly with Sui Testnet GraphQL RPC</span>
          </div>
          <button
            onClick={onBack}
            className="text-white hover:text-[var(--color-sui)] transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
