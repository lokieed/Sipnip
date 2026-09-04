// ============================================================
// MOCK DATA & FAKE BACKEND
// Everything in this file is FAKE. It simulates what your
// teammates' AI + Sui code will eventually do for real.
//
// To go live later: replace the function bodies below with
// real API/SDK calls. The rest of the app doesn't need to change,
// as long as these functions return the same shapes (see types.ts).
// ============================================================

import type { ActivityItem, ProposedAction, WalletState } from './types';
import { resolveRecipient } from './contacts';

export const REAL_WALLET_ADDRESS =
  '0x5a74b232069d7114400321fb89116192f219a32d3849f233928157aac5afc7b3';

export const MOCK_WALLET: WalletState = {
  connected: false,
  address: REAL_WALLET_ADDRESS,
  balance: undefined,
};

export const MOCK_ACTIVITY: ActivityItem[] = [];

// Fake "AI understands the request" — very simple keyword parsing
// Fake "AI understands the request" — keyword fallback
export function fakeParseIntent(userText: string): ProposedAction | null {
  const text = userText.toLowerCase();
  const amountMatch = text.match(/(\d+(\.\d+)?)\s*sui/);
  const toMatch = text.match(/to\s+([a-zA-Z]+)/);

  if (!amountMatch) return null;

  const rawRecipient = toMatch ? capitalize(toMatch[1]) : 'Unknown';
  const contact = resolveRecipient(rawRecipient);
  const displayRecipient = contact
    ? `${contact.name} (${contact.address.slice(0, 6)}...${contact.address.slice(-4)})`
    : rawRecipient;

  return {
    id: `action-${Date.now()}`,
    type: 'send_payment',
    status: 'proposed',
    summary: `Send ${amountMatch[1]} SUI to ${displayRecipient}`,
    recipient: displayRecipient,
    recipientAddress: contact?.address,
    amount: parseFloat(amountMatch[1]),
    token: 'SUI',
    purpose: extractPurpose(text),
    network: 'Sui Testnet',
    createdAt: new Date().toISOString(),
  };
}

function extractPurpose(text: string): string {
  const forMatch = text.match(/for\s+([a-zA-Z\s]+)$/);
  return forMatch ? forMatch[1].trim() : 'General payment';
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Fake Sui execution — waits, then randomly succeeds (90%) or fails
export function fakeExecuteOnSui(): Promise<{ success: boolean; digest?: string; error?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        resolve({ success: true, digest: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6) });
      } else {
        resolve({ success: false, error: 'The network could not confirm this transaction in time.' });
      }
    }, 1800);
  });
}
