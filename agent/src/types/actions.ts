/**
 * AI -> Integration Contract
 * These are the strictly typed actions produced by the AI Agent.
 * Member 4 (Integration) consumes these to trigger Member 3's Sui operations.
 */

export interface TransferAction {
  action: 'transfer';
  recipient: string; // Recipient address or name (e.g. "0x...", "Alice")
  amount: number;    // Numeric transfer amount
  token: string;     // Token symbol, default 'SUI'
}

export interface GetBalanceAction {
  action: 'get_balance';
  token?: string;    // Token to check balance for, default 'SUI'
}

export interface GetTransactionsAction {
  action: 'get_transactions';
  limit?: number;    // Number of recent transactions to fetch (e.g., 5, 10)
}

export interface UnknownAction {
  action: 'unknown';
  reason: string;    // Why the AI could not map the request to an action
}

/**
 * Discriminated Union of all actions the AI can emit.
 * Member 4 can switch on `action.action` with full type safety!
 */
export type AgentAction =
  | TransferAction
  | GetBalanceAction
  | GetTransactionsAction
  | UnknownAction;

/**
 * Standard envelope returned by the AI agent
 */
export interface AgentResult {
  success: boolean;
  action: AgentAction;
  rawInput: string;
  explanation?: string;
}
