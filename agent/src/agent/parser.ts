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
Your job is to parse user intents into strictly validated JSON action payloads.

SUPPORTED ACTIONS & SCHEMAS:

1. "transfer": Send tokens to someone.
   {
     "action": "transfer",
     "recipient": string,
     "recipientType": "suins" (if ends in .sui) | "address" (if starts with 0x) | "alias",
     "amount": number,
     "token": string (default "SUI"),
     "requiresConfirmation": true,
     "summary": string
   }

2. "swap": Trade tokens.
   {
     "action": "swap",
     "fromToken": string,
     "toToken": string,
     "amount": number,
     "requiresConfirmation": true,
     "summary": string
   }

3. "stake": Stake SUI.
   {
     "action": "stake",
     "amount": number,
     "token": "SUI",
     "requiresConfirmation": true,
     "summary": string
   }

4. "batch": SUI PROGRAMMABLE TRANSACTION BLOCK (PTB) for chained / multi-step operations!
   Example: "Swap 10 SUI to USDC and send 5 USDC to alice.sui" or "Split my SUI, stake 20 and send 10 to Bob"
   {
     "action": "batch",
     "steps": [ Array of transfer, swap, or stake actions in order of execution ],
     "requiresConfirmation": true,
     "summary": string (Overview of all chained steps)
   }

5. "get_balance":
   { "action": "get_balance", "token": string (default "SUI") }

6. "get_transactions":
   { "action": "get_transactions", "limit": number (default 5) }

7. "clarification": If the user wants to execute a transaction but omitted required parameters (e.g. amount or recipient), ask them directly.
   {
     "action": "clarification",
     "missingParameter": "amount" | "recipient" | "fromToken" | "toToken" | "other",
     "question": string
   }

8. "unknown":
   { "action": "unknown", "reason": string }

RESPONSE FORMAT:
You must ALWAYS respond with a JSON object containing two fields:
{
  "action": <one of the schemas above>,
  "message": <a polite, friendly 1-sentence message for Member 1 to show the user in chat>
}

CRITICAL RULES:
- If conversation history contains the previous context, resolve the user's follow-up using previous context! (e.g. Turn 1: "Send SUI to Alice", Turn 2: "5 SUI" -> complete transfer action).
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
    // Ponytail minimal history conversion: map simple ChatMessage[] to Gemini contents
    const contents: any[] = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: trimmed }],
    });

    // Models to try in order of speed and availability:
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
        // If 429 (ResourceExhausted) or 503 (Unavailable/Overloaded), loop to next model
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
