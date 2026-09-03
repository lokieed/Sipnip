# 🤖 AI Wallet Agent — Integration Contract

> **Author:** Member 2 (AI Agent / NLU Lead)  
> **Audience:** Member 1 (Frontend), Member 3 (Sui Blockchain), Member 4 (Integration/Backend)

---

## 1. What This AI Module Does

This module translates raw, unstructured user chat messages into **strongly-typed JSON action objects**. 

It handles:
* Intent recognition (Transfer, Balance check, Transaction history).
* Entity extraction (Recipient names/addresses, token amounts, token tickers).
* Guardrails (Flags off-topic or ambiguous requests as `unknown`).
* **Zero Autonomous Execution**: The AI *only proposes structured actions*. It never holds private keys and never directly executes transactions on Sui.

---

## 2. Architecture & Data Flow

```
[User Chat] (Member 1 - Frontend)
      │
      ▼
[AI Agent Module] (Member 2 - parseUserIntent)
      │
      ▼
[Structured Action JSON]
      │
      ▼
[Validation & Routing] (Member 4 - Integration)
      │
      ▼
[Sui Transaction / RPC] (Member 3 - Sui SDK & Wallet)
```

---

## 3. Supported Actions & JSON Schemas

The TypeScript interfaces are defined in [`src/types/actions.ts`](./src/types/actions.ts).

### A. `transfer`
Emitted when the user requests to send funds to another user or address.
```json
{
  "action": "transfer",
  "recipient": "0x1234567890abcdef",
  "amount": 5,
  "token": "SUI"
}
```

### B. `get_balance`
Emitted when the user inquires about their balance.
```json
{
  "action": "get_balance",
  "token": "SUI"
}
```

### C. `get_transactions`
Emitted when the user asks to see recent wallet history.
```json
{
  "action": "get_transactions",
  "limit": 5
}
```

### D. `unknown` (Fallback / Guardrail)
Emitted when an input is off-topic, nonsensical, or cannot be safely mapped.
```json
{
  "action": "unknown",
  "reason": "Input does not match any known wallet operation."
}
```

---

## 4. How Member 4 (Integration) Consumes This

Member 4 can import `parseUserIntent` directly into the backend or API route:

```typescript
import { parseUserIntent } from './agent/parser.js';

const result = await parseUserIntent("Send Alice 10 SUI");

switch (result.action.action) {
  case 'transfer':
    // 1. Resolve 'Alice' to address if needed
    // 2. Pass { recipient, amount, token } to Member 3's Sui transfer builder
    // 3. Prompt user on frontend to sign
    break;

  case 'get_balance':
    // Query Member 3's getBalance RPC
    break;

  case 'get_transactions':
    // Query Member 3's getTransactions RPC
    break;

  case 'unknown':
    // Return friendly error message to Member 1's frontend chat
    break;
}
```

---

## 5. Security Principles

1. **No Keys in AI**: The AI never has access to private keys or seed phrases.
2. **Deterministic Validation**: Member 4 must validate that `amount > 0` and `recipient` is valid before initiating any Sui transaction.
3. **User Confirmation**: All financial transfers must require explicit user approval on the frontend before signing.
