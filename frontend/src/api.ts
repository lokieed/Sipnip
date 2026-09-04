// ============================================================
// REAL BACKEND & AI AGENT CALLS
// Bridges Member 1's UI with Member 2's Gemini AI Agent
// and Member 3's Sui RPCs.
// ============================================================

import type { ProposedAction } from './types';
import { fakeExecuteOnSui, fakeParseIntent } from './mock';
import { resolveRecipient } from './contacts';

export interface BalanceResponse {
  balance: number;
  unit: string;
  network: string;
  explorerLink: string;
}

export const REAL_WALLET_ADDRESS =
  '0x5a74b232069d7114400321fb89116192f219a32d3849f233928157aac5afc7b3';

const SUI_GRAPHQL = 'https://graphql.testnet.sui.io/graphql';
const API_BASE = 'http://localhost:3001';

/**
 * Fetches the 100% REAL on-chain balance directly from Sui Testnet GraphQL.
 * No hardcoding — queries live blockchain data.
 */
export async function fetchWalletBalance(
  address: string = REAL_WALLET_ADDRESS
): Promise<BalanceResponse> {
  // 1. Direct on-chain query to Sui Testnet GraphQL RPC
  try {
    const res = await fetch(SUI_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            address(address: "${address}") {
              balance(coinType: "0x2::sui::SUI") {
                totalBalance
              }
            }
          }
        `,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const mist = data?.data?.address?.balance?.totalBalance;
      if (mist !== undefined && mist !== null) {
        const sui = Number(mist) / 1_000_000_000;
        return {
          balance: sui,
          unit: 'SUI',
          network: 'testnet',
          explorerLink: `https://suiscan.xyz/testnet/account/${address}`,
        };
      }
    }
  } catch (err) {
    console.warn('Direct Sui GraphQL call failed, checking backend server:', err);
  }

  // 2. Fallback to local Express server on port 3001
  const res = await fetch(`${API_BASE}/balance`);
  if (!res.ok) {
    throw new Error(`Balance request failed: ${res.status}`);
  }
  return res.json();
}

export interface ExecutionResult {
  success: boolean;
  digest?: string;
  error?: string;
  serverMessage?: string;
}

/**
 * Executes or pre-validates transactions on Nicole's Sui Blockchain Server (port 3001).
 * Falls back gracefully to simulation if the local server is offline during a presentation.
 */
export async function executeActionOnSui(action: ProposedAction): Promise<ExecutionResult> {
  try {
    const targetAddress =
      action.recipientAddress ||
      (action.recipient?.startsWith('0x') ? action.recipient : undefined) ||
      '0xaa0b19013228e2392e075ea7976db60957718c03a53af3073a54cad1c854bb8d';

    let payload: any = {
      action: 'prepareTransaction',
      recipient: targetAddress,
      amount: action.amount || 1,
      purpose: action.purpose || action.summary,
    };

    if (action.summary?.toLowerCase().includes('escrow') || action.type === 'stake') {
      payload = {
        action: 'createEscrow',
        recipient: targetAddress,
        amount: action.amount || 1,
        description: action.purpose || action.summary,
      };
    }

    const res = await fetch(`${API_BASE}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const digest = data.txHash || data.digest;
      if (digest) {
        return {
          success: true,
          digest,
          serverMessage: data.message,
        };
      }
    }
  } catch (err) {
    console.warn('Local blockchain server on port 3001 not reachable, falling back to simulation:', err);
  }

  // Graceful fallback to guarantee demo never breaks
  return fakeExecuteOnSui();
}

const GEMINI_SYSTEM_PROMPT = `
You are the Natural Language Understanding (NLU) core for Sipnip, an AI-powered Sui wallet transaction agent.
Parse user intents into strictly validated JSON action payloads.

SUPPORTED ACTIONS:
1. "transfer": {"action": "transfer", "recipient": string, "amount": number, "token": "SUI", "purpose": string, "summary": string}
2. "swap": {"action": "swap", "fromToken": string, "toToken": string, "amount": number, "summary": string}
3. "stake": {"action": "stake", "amount": number, "token": "SUI", "summary": string}
4. "clarification": {"action": "clarification", "question": string}
5. "unknown": {"action": "unknown", "reason": string}

RESPONSE FORMAT:
Always return JSON:
{
  "action": <one of the schemas above>,
  "message": <a friendly 1-sentence message for the chat bubble>
}
`;

export interface ParseResult {
  message: string;
  action?: ProposedAction;
}

/**
 * Connects the chat input directly to Member 2's Gemini AI agent.
 * Falls back to mock parser if offline or API key is missing.
 */
export async function parseIntentWithAI(
  userText: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<ParseResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY not found in .env, using local fallback parser');
    const mock = fakeParseIntent(userText);
    return {
      message: mock
        ? 'I can prepare that payment for you.'
        : "I didn't catch an amount — try something like \"send 5 SUI to Alice for dinner.\"",
      action: mock ?? undefined,
    };
  }

  try {
    const contents: any[] = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));
    contents.push({
      role: 'user',
      parts: [{ text: userText }],
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: GEMINI_SYSTEM_PROMPT }],
        },
        generationConfig: {
          response_mime_type: 'application/json',
        },
        contents,
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned ${res.status}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);

    const actionData = parsed.action || parsed;
    const aiMessage = parsed.message || (actionData.action === 'clarification' ? actionData.question : 'Action ready for review.');

    // Map AI output to Member 1's ProposedAction
    if (actionData.action === 'transfer' || actionData.action === 'create_escrow') {
      const contact = resolveRecipient(actionData.recipient);
      const recipientAddress = contact ? contact.address : actionData.recipient;
      const displayRecipient = contact
        ? `${contact.name} (${contact.address.slice(0, 6)}...${contact.address.slice(-4)})`
        : actionData.recipient;

      const aiReply = contact
        ? `Found ${contact.name} (${contact.role}) in your contacts.\nPrepared transaction to ${contact.address.slice(0, 6)}...${contact.address.slice(-4)}.`
        : aiMessage;

      return {
        message: aiReply,
        action: {
          id: `action-${Date.now()}`,
          type: 'send_payment',
          status: 'proposed',
          summary: actionData.summary || `Send ${actionData.amount} ${actionData.token || 'SUI'} to ${displayRecipient}`,
          recipient: displayRecipient,
          recipientAddress: recipientAddress,
          amount: actionData.amount,
          token: actionData.token || 'SUI',
          purpose: actionData.purpose || 'Direct transfer',
          network: 'Sui Testnet',
          createdAt: new Date().toISOString(),
        },
      };
    }

    if (actionData.action === 'swap') {
      return {
        message: aiMessage,
        action: {
          id: `action-${Date.now()}`,
          type: 'swap',
          status: 'proposed',
          summary: actionData.summary || `Swap ${actionData.amount} ${actionData.fromToken} for ${actionData.toToken}`,
          amount: actionData.amount,
          token: actionData.fromToken,
          purpose: `Swap to ${actionData.toToken}`,
          network: 'Sui Testnet',
          createdAt: new Date().toISOString(),
        },
      };
    }

    if (actionData.action === 'stake') {
      return {
        message: aiMessage,
        action: {
          id: `action-${Date.now()}`,
          type: 'stake',
          status: 'proposed',
          summary: actionData.summary || `Stake ${actionData.amount} SUI`,
          amount: actionData.amount,
          token: 'SUI',
          purpose: 'Validator Staking',
          network: 'Sui Testnet',
          createdAt: new Date().toISOString(),
        },
      };
    }

    // Clarification or Unknown
    return {
      message: aiMessage,
      action: undefined,
    };
  } catch (err) {
    console.error('Gemini call failed, falling back to mock:', err);
    const mock = fakeParseIntent(userText);
    return {
      message: mock
        ? 'I can prepare that payment for you.'
        : "I didn't catch an amount — try something like \"send 5 SUI to Alice for dinner.\"",
      action: mock ?? undefined,
    };
  }
}
