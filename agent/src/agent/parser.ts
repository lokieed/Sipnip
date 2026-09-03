import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import { AgentAction, AgentResult, ChatMessage } from '../types/actions.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in .env');
}

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are the Natural Language Understanding (NLU) core for Sipnip, an AI-powered Sui wallet transaction agent.
Your job is to parse user intents into strictly validated JSON action payloads compatible with our Sui Move smart contracts.

SUPPORTED ACTIONS & SCHEMAS:

1. "transfer": Send tokens to someone directly.
   {
     "action": "transfer",
     "recipient": string,
     "recipientType": "suins" (if ends in .sui) | "address" (if starts with 0x) | "alias",
     "amount": number,
     "token": string (default "SUI"),
     "purpose": string (optional reason, e.g. "design work"),
     "requiresConfirmation": true,
     "summary": string
   }

2. "create_escrow": Lock payment in an escrow contract until conditions or deliverables are met.
   Example: "Create an escrow of 5 SUI for Alice for website design" or "Lock 10 SUI in escrow for Bob"
   {
     "action": "create_escrow",
     "recipient": string,
     "recipientType": "suins" | "address" | "alias",
     "amount": number,
     "currency": "SUI",
     "description": string (e.g. "website design"),
     "requiresConfirmation": true,
     "summary": string
   }

3. "release_payment": Release funds from an existing escrow to the recipient.
   Example: "Release payment of 5 SUI for escrow_123 to Alice"
   {
     "action": "release_payment",
     "escrowId": string,
     "recipient": string,
     "amount": number,
     "requiresConfirmation": true,
     "summary": string
   }

4. "refund": Refund locked escrow funds back to the sender.
   Example: "Refund 5 SUI from escrow_123"
   {
     "action": "refund",
     "escrowId": string,
     "sender": string (optional),
     "amount": number,
     "requiresConfirmation": true,
     "summary": string
   }

5. "swap": Trade tokens.
   {
     "action": "swap",
     "fromToken": string,
     "toToken": string,
     "amount": number,
     "requiresConfirmation": true,
     "summary": string
   }

6. "stake": Stake SUI.
   {
     "action": "stake",
     "amount": number,
     "token": "SUI",
     "requiresConfirmation": true,
     "summary": string
   }

7. "batch": SUI PROGRAMMABLE TRANSACTION BLOCK (PTB) for chained operations!
   {
     "action": "batch",
     "steps": [ Array of transfer, create_escrow, swap, or stake actions ],
     "requiresConfirmation": true,
     "summary": string
   }

8. "get_balance":
   { "action": "get_balance", "token": string (default "SUI") }

9. "get_transactions":
   { "action": "get_transactions", "limit": number (default 5) }

10. "clarification": If the user wants to execute a transfer, escrow, or swap but omitted required parameters (e.g. amount or recipient), ask them directly.
   {
     "action": "clarification",
     "missingParameter": "amount" | "recipient" | "description" | "escrowId" | "other",
     "question": string
   }

11. "unknown":
   { "action": "unknown", "reason": string }

RESPONSE FORMAT:
You must ALWAYS respond with a JSON object containing two fields:
{
  "action": <one of the schemas above>,
  "message": <a polite, friendly 1-sentence message for Member 1 to show the user in chat>
}

CRITICAL RULES:
- If conversation history contains the previous context, resolve follow-up using previous context!
- Output ONLY valid raw JSON. No markdown backticks.
`;

/**
 * Parses user input into a strongly-typed AgentAction, supporting multi-turn conversation history.
 */
export async function parseUserIntent(
  userInput: string,
  history: ChatMessage[] = []
): Promise<AgentResult> {
  const trimmed = userInput.trim();
  if (!trimmed) {
    return {
      success: false,
      action: { action: 'unknown', reason: 'Input is empty.' },
      message: 'Please provide a message or command.',
      rawInput: userInput,
    };
  }

  try {
    const contents: any[] = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: trimmed }],
    });

    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
    ];

    let lastError: any = null;
    let jsonText = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
          },
        });
        jsonText = response.text?.trim() || '{}';
        if (jsonText && jsonText !== '{}') break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    if (!jsonText || jsonText === '{}') {
      throw lastError || new Error('All model candidates failed.');
    }
    const parsed = JSON.parse(jsonText);

    const action: AgentAction = parsed.action || parsed;
    const message: string =
      parsed.message ||
      (action.action === 'clarification' ? action.question : 'Action ready for confirmation.');

    return {
      success: action.action !== 'unknown',
      action,
      message,
      rawInput: userInput,
    };
  } catch (error: any) {
    return {
      success: false,
      action: {
        action: 'unknown',
        reason: error?.message || 'Failed to parse user input.',
      },
      message: 'Sorry, I encountered an issue processing your request.',
      rawInput: userInput,
    };
  }
}
