// ============================================================
// REAL BACKEND & AI AGENT CALLS
// Bridges Member 1's UI with Member 2's Gemini AI Agent
// and Member 3's Sui RPCs.
// ============================================================

import type { ProposedAction } from './types';
import { fakeParseIntent } from './mock';

export interface BalanceResponse {
  balance: number;
  unit: string;
  network: string;
  explorerLink: string;
}

const API_BASE = 'http://localhost:3001';

export async function fetchWalletBalance(): Promise<BalanceResponse> {
  const res = await fetch(`${API_BASE}/balance`);
  if (!res.ok) {
    throw new Error(`Balance request failed: ${res.status}`);
  }
  return res.json();
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
    if (actionData.action === 'transfer') {
      return {
        message: aiMessage,
        action: {
          id: `action-${Date.now()}`,
          type: 'send_payment',
          status: 'proposed',
          summary: actionData.summary || `Send ${actionData.amount} ${actionData.token || 'SUI'} to ${actionData.recipient}`,
          recipient: actionData.recipient,
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
