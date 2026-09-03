/**
 * AI -> Integration Contract (Version 3.0 - Sui PTB & Multi-Turn Support)
 * These are the strictly typed actions produced by the AI Agent.
 * Member 4 (Integration) consumes these to trigger Member 3's Sui operations.
 */

export interface FinancialActionBase {
  requiresConfirmation: true;
  summary: string; // Human-friendly preview message for Member 1's UI
}

export interface TransferAction extends FinancialActionBase {
  action: 'transfer';
  recipient: string; // Recipient address, .sui name, or alias
  recipientType: 'suins' | 'address' | 'alias';
  amount: number;
  token: string; // Default 'SUI'
}

export interface SwapAction extends FinancialActionBase {
  action: 'swap';
  fromToken: string; // e.g. "SUI"
  toToken: string;   // e.g. "USDC"
  amount: number;
  slippage?: number;
}

export interface StakeAction extends FinancialActionBase {
  action: 'stake';
  amount: number;
  token: 'SUI';
  validatorAddress?: string;
}

/**
 * Sui Programmable Transaction Block (PTB) Batch Action
 * Chains multiple actions in a single atomic transaction!
 */
export interface BatchAction extends FinancialActionBase {
  action: 'batch';
  steps: Array<TransferAction | SwapAction | StakeAction>;
}

export interface GetBalanceAction {
  action: 'get_balance';
  token?: string;
}

export interface GetTransactionsAction {
  action: 'get_transactions';
  limit?: number;
}

export interface ClarificationAction {
  action: 'clarification';
  missingParameter: 'amount' | 'recipient' | 'fromToken' | 'toToken' | 'other';
  question: string;
}

export interface UnknownAction {
  action: 'unknown';
  reason: string;
}

export type SingleAction =
  | TransferAction
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
  message: string; // Natural chat response for Member 1's UI
  rawInput: string;
}
