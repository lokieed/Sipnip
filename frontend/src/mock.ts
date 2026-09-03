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

export const MOCK_WALLET: WalletState = {
  connected: false,
  address: '0x8f2a...c91e',
  balance: 42.5,
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    summary: 'Sent 2 SUI to Bob',
    status: 'success',
    timestamp: '2 hours ago',
    txDigest: '0x91af...3c02',
  },
  {
    id: 'a2',
    summary: 'Staked 10 SUI',
    status: 'success',
    timestamp: 'Yesterday',
    txDigest: '0x44be...9911',
  },
];

// Fake "AI understands the request" — very simple keyword parsing
// just so the demo works. Your teammate's real AI will replace this.
export function fakeParseIntent(userText: string): ProposedAction | null {
  const text = userText.toLowerCase();
  const amountMatch = text.match(/(\d+(\.\d+)?)\s*sui/);
  const toMatch = text.match(/to\s+([a-zA-Z]+)/);

  if (!amountMatch) return null;

  return {
    id: `action-${Date.now()}`,
    type: 'send_payment',
    status: 'proposed',
    summary: `Send ${amountMatch[1]} SUI to ${toMatch ? capitalize(toMatch[1]) : 'recipient'}`,
    recipient: toMatch ? capitalize(toMatch[1]) : 'Unknown',
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
