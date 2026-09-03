/**
 * Bridge Adapter: AI Agent (P2) ↔ Sui Blockchain Server (P3)
 * Converts high-level AI intents into exact payloads accepted by
 * contracts/server.js (POST /action) and Move smart contracts.
 */

import { AgentAction, BlockchainServerCommand } from '../types/actions.js';

/**
 * Maps an AgentAction into Nicole's contracts/server.js format
 */
export function toBlockchainServerCommand(
  action: AgentAction
): BlockchainServerCommand | null {
  switch (action.action) {
    case 'transfer':
      return {
        action: 'prepareTransaction',
        recipient: action.recipient,
        amount: action.amount,
        purpose: action.purpose,
      };

    case 'create_escrow':
      return {
        action: 'createEscrow',
        recipient: action.recipient,
        amount: action.amount,
        description: action.description,
        currency: action.currency || 'SUI',
      };

    case 'release_payment':
      return {
        action: 'releasePayment',
        escrowId: action.escrowId,
        recipient: action.recipient,
        amount: action.amount,
      };

    case 'refund':
      return {
        action: 'refund',
        escrowId: action.escrowId,
        sender: action.sender,
        amount: action.amount,
      };

    case 'get_balance':
      return {
        action: 'checkBalance',
        address: action.address,
      };

    default:
      // Other actions (swap, stake, batch) are handled via PTB directly
      return null;
  }
}

/**
 * Sends the structured command to Nicole's contracts/server.js (running on port 3001)
 */
export async function sendToContractsServer(
  command: BlockchainServerCommand,
  serverUrl = 'http://localhost:3001'
): Promise<any> {
  const res = await fetch(`${serverUrl}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    throw new Error(`Contracts server returned ${res.status}: ${res.statusText}`);
  }

  return res.json();
}
