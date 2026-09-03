# 🤖 Sipnip AI Wallet Agent — Integration Contract (v3.0)

> **Author:** Member 2 (AI Agent / NLU Lead)  
> **Audience:** Member 1 (Frontend), Member 3 (Sui Blockchain / PTB Lead), Member 4 (Integration/Backend)

---

## 1. What This AI Module Does

This module translates natural language chat messages into **strongly-typed JSON action objects** with:
* **Multi-turn Memory:** Remembers context across messages (e.g., Turn 1: *"Send SUI to Alice"*, Turn 2: *"5 SUI"* ➔ outputs completed transfer).
* **Sui Programmable Transaction Blocks (PTB):** Chains multi-step intents into a single atomic batch (e.g., *"Swap SUI to USDC and send USDC to Alice"*).
* **SuiNS Detection:** Automatically flags recipients as `suins` (`alice.sui`), `address` (`0x...`), or `alias`.
* **Zero Autonomous Risk:** The AI *only proposes structured actions*. It never holds private keys and never signs transactions.

---

## 2. Architecture & Data Flow

```
[User Chat] (Member 1 - Frontend)
      │
      ▼
[AI Agent Module] (Member 2 - parseUserIntent(input, history))
      │
      ├───────────────────────► [Clarification Needed?]
      │                         AI returns friendly question to chat
      ▼
[Structured Action JSON]
      │
      ▼
[Validation & PTB Construction] (Member 4 Integration & Member 3 Sui SDK)
      │
      ▼
[Transaction Preview & Signing] (Member 1 - Frontend UI modal)
      │
      ▼
[Sui Blockchain Execution] (Atomic PTB on Sui Testnet/Mainnet)
```

---

## 3. Supported Actions & JSON Schemas

TypeScript interfaces are in [`src/types/actions.ts`](./src/types/actions.ts).

### A. `batch` (Sui Programmable Transaction Block) 🌟
Emitted when user requests multi-step operations in one sentence.
```json
{
  "action": "batch",
  "steps": [
    {
      "action": "swap",
      "fromToken": "SUI",
      "toToken": "USDC",
      "amount": 10,
      "requiresConfirmation": true,
      "summary": "Swap 10 SUI for USDC"
    },
    {
      "action": "transfer",
      "recipient": "alice.sui",
      "recipientType": "suins",
      "amount": 5,
      "token": "USDC",
      "requiresConfirmation": true,
      "summary": "Transfer 5 USDC to alice.sui"
    }
  ],
  "requiresConfirmation": true,
  "summary": "Swap 10 SUI to USDC and send 5 USDC to alice.sui in one atomic Sui PTB"
}
```

### B. `transfer`
```json
{
  "action": "transfer",
  "recipient": "alice.sui",
  "recipientType": "suins",
  "amount": 5,
  "token": "SUI",
  "requiresConfirmation": true,
  "summary": "Transfer 5 SUI to alice.sui"
}
```

### C. `swap`
```json
{
  "action": "swap",
  "fromToken": "SUI",
  "toToken": "USDC",
  "amount": 20,
  "requiresConfirmation": true,
  "summary": "Swap 20 SUI for USDC"
}
```

### D. `stake`
```json
{
  "action": "stake",
  "amount": 50,
  "token": "SUI",
  "validatorAddress": "optional_0x_address",
  "requiresConfirmation": true,
  "summary": "Stake 50 SUI"
}
```

### E. `clarification`
Emitted when required parameters are missing.
```json
{
  "action": "clarification",
  "missingParameter": "amount",
  "question": "How much SUI would you like to send to bob.sui?"
}
```

---

## 4. Frontend & Backend Integration Example

```typescript
import { parseUserIntent, ChatMessage } from './agent/index.js';

// Keep state in your frontend or session
const chatHistory: ChatMessage[] = [];

async function handleUserMessage(userText: string) {
  const result = await parseUserIntent(userText, chatHistory);

  // Update history
  chatHistory.push({ role: 'user', text: userText });
  chatHistory.push({ role: 'model', text: result.message });

  // 1. Show natural AI text in the chat bubble
  displayBotBubble(result.message);

  // 2. Handle structured action
  switch (result.action.action) {
    case 'batch':
      // Member 3 constructs atomic Sui PTB with result.action.steps
      showTransactionModal(result.action.summary, () => signPTB(result.action.steps));
      break;

    case 'transfer':
      showTransactionModal(result.action.summary, () => signTransfer(result.action));
      break;

    case 'swap':
      showTransactionModal(result.action.summary, () => signSwap(result.action));
      break;

    case 'stake':
      showTransactionModal(result.action.summary, () => signStake(result.action));
      break;

    case 'clarification':
      // Just waiting for user's next answer!
      break;
  }
}
```
