/**
 * AI -> Integration Contract (Version 4.0 - Full Smart Contract & Escrow Compatibility)
 * These are the strictly typed actions produced by the AI Agent.
 * Compatible with Nicole's Move smart contract (contracts/sources/escrow.move)
 * and server (contracts/server.js).
 */

export interface FinancialActionBase {
  requiresConfirmation: true;
  summary: string; // Human-friendly preview message for Member 1's UI
}

/**
 * Direct transfer of SUI / tokens
 * Maps to contracts/index.js -> prepareTransaction
 */
export interface TransferAction extends FinancialActionBase {
  action: 'transfer';
  recipient: string; // Recipient address, .sui name, or alias
  recipientType: 'suins' | 'address' | 'alias';
  amount: number;
  token: string;     // Default 'SUI'
  purpose?: string;  // e.g. "design work"
}

/**
 * Create on-chain escrow (Move module: sipnip::escrow::create_escrow)
 * Maps to contracts/index.js -> createEscrow
 */
export interface CreateEscrowAction extends FinancialActionBase {
  action: 'create_escrow';
  recipient: string;
  recipientType: 'suins' | 'address' | 'alias';
  amount: number;
  currency: string;  // 'SUI'
  description: string; // Purpose / condition e.g. "website design work"
}

/**
 * Release payment from escrow (Move module: sipnip::escrow::release_payment)
 * Maps to contracts/index.js -> releasePayment
 */
export interface ReleasePaymentAction extends FinancialActionBase {
  action: 'release_payment';
  escrowId: string;
  recipient: string;
  amount: number;
}

/**
 * Refund escrow back to sender (Move module: sipnip::escrow::refund)
 * Maps to contracts/index.js -> refund
 */
export interface RefundAction extends FinancialActionBase {
  action: 'refund';
  escrowId: string;
  sender?: string;
  amount: number;
}

/**
 * Swap tokens (DEX)
 */
export interface SwapAction extends FinancialActionBase {
  action: 'swap';
  fromToken: string;
  toToken: string;
  amount: number;
  slippage?: number;
}

/**
 * Stake SUI
 */
export interface StakeAction extends FinancialActionBase {
  action: 'stake';
  amount: number;
  token: 'SUI';
  validatorAddress?: string;
}

/**
 * Sui Programmable Transaction Block (PTB) Batch Action
 */
export interface BatchAction extends FinancialActionBase {
  action: 'batch';
  steps: Array<TransferAction | CreateEscrowAction | SwapAction | StakeAction>;
}

export interface GetBalanceAction {
  action: 'get_balance';
  token?: string;
  address?: string;
}

export interface GetTransactionsAction {
  action: 'get_transactions';
  limit?: number;
}

export interface ClarificationAction {
  action: 'clarification';
  missingParameter: 'amount' | 'recipient' | 'description' | 'escrowId' | 'other';
  question: string;
}

export interface UnknownAction {
  action: 'unknown';
  reason: string;
}

export type SingleAction =
  | TransferAction
  | CreateEscrowAction
  | ReleasePaymentAction
  | RefundAction
  | SwapAction
  | StakeAction
  | GetBalanceAction
  | GetTransactionsAction
  | ClarificationAction
  | UnknownAction;

export type AgentAction = SingleAction | BatchAction;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AgentResult {
  success: boolean;
  action: AgentAction;
  message: string;
  rawInput: string;
}

/**
 * The exact format expected by Nicole's contracts/server.js (POST /action)
 */
export type BlockchainServerCommand =
  | { action: 'checkBalance'; address?: string }
  | { action: 'prepareTransaction'; recipient: string; amount: number; purpose?: string }
  | { action: 'createEscrow'; recipient: string; amount: number; description: string; currency?: string }
  | { action: 'releasePayment'; escrowId: string; recipient: string; amount: number }
  | { action: 'refund'; escrowId: string; sender?: string; amount: number };
