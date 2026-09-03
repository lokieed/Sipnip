import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import { AgentAction, AgentResult } from '../types/actions.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in .env');
}

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are a precise Natural Language Understanding (NLU) engine for a Sui blockchain wallet.
Your job is to parse user intents into structured JSON actions.

Supported actions:
1. "transfer": When user wants to send, pay, or transfer tokens to someone.
   Format: {"action": "transfer", "recipient": string, "amount": number, "token": string}
   Default token is "SUI" if not mentioned.

2. "get_balance": When user asks for their wallet balance, funds, or token balance.
   Format: {"action": "get_balance", "token": "SUI"}

3. "get_transactions": When user asks to see recent transactions, history, or activity.
   Format: {"action": "get_transactions", "limit": number} (default limit: 5)

4. "unknown": When the request is off-topic, unsafe, or cannot be mapped to a wallet action.
   Format: {"action": "unknown", "reason": string}

CRITICAL RULES:
- Output ONLY valid JSON matching one of the above action schemas.
- Do not output markdown backticks or explanations.
- Default token to "SUI" if not specified.
`;

/**
 * Parses natural language input into a strongly-typed AgentAction
 */
export async function parseUserIntent(userInput: string): Promise<AgentResult> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Parse this user message: "${userInput}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const action: AgentAction = JSON.parse(jsonText);

    return {
      success: action.action !== 'unknown',
      action,
      rawInput: userInput,
    };
  } catch (error: any) {
    return {
      success: false,
      action: {
        action: 'unknown',
        reason: error?.message || 'Failed to parse user input',
      },
      rawInput: userInput,
    };
  }
}
