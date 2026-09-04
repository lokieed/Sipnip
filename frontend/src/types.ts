// ============================================================
// SHARED TYPES
// This is the "contract" — show this file to your AI/backend
// and Sui teammates so their output matches what the UI expects.
// ============================================================

export type ActionType = 'send_payment' | 'swap' | 'stake';

export type ActionStatus =
  | 'proposed'   // AI suggested it, waiting for user to review
  | 'confirmed'  // user approved, about to execute
  | 'processing' // submitted to Sui, waiting for result
  | 'success'
  | 'error'
  | 'rejected';  // user cancelled

export interface ProposedAction {
  id: string;
  type: ActionType;
  status: ActionStatus;
  summary: string;        // e.g. "Send 5 SUI to Alice"
  recipient?: string;
  recipientAddress?: string; // real 0x Sui address
  amount?: number;
  token?: string;         // e.g. "SUI"
  purpose?: string;
  network?: string;       // e.g. "Sui Testnet"
  txDigest?: string;      // filled in after success
  errorMessage?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  action?: ProposedAction; // present when the AI is proposing something
}

export interface WalletState {
  connected: boolean;
  address?: string;
  balance?: number; // in SUI
}

export interface ActivityItem {
  id: string;
  summary: string;
  status: ActionStatus;
  timestamp: string;
  txDigest?: string;
}
