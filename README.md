# 🤖 Sipnip — AI-Powered Natural Language Wallet on Sui Network

> **MUBA Blockchain Hackathon 2026** — *Democratizing Web3 by making wallets speak human.*

[![Sui Testnet](https://img.shields.io/badge/Sui-Testnet-0284c7?logo=sui&logoColor=white)](https://suiscan.xyz/testnet/package/0xa1cb6dc073981bb0d28aa2281afa3d434295666972a60b5410e49a005acf08a6)
[![Move](https://img.shields.io/badge/Smart%20Contracts-Sui%20Move-3b82f6)](./contracts)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%20API-4285f4?logo=google)](./agent)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-61dafb?logo=react)](./frontend)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## 📌 Executive Summary

Interacting with Web3 today is intimidating: confusing hex addresses, complicated gas calculations, manual token approvals, and disjointed DeFi workflows. 

**Sipnip** is an intelligent AI wallet agent native to the **Sui Network**. It translates everyday natural language commands (e.g. *"Send 5 SUI to Ahmad for design work"*, *"Lock 10 SUI into escrow for my website logo"*) into verifiable, atomic on-chain transactions.

With **zero autonomous private key risk**, Sipnip implements a strict **Human-in-the-Loop** paradigm: the AI interprets intent and proposes structured action cards; the user reviews and signs natively through their Sui wallet standard extension (Slush / Sui Wallet).

---

## ⚡ Key Highlights & Why Sui?

Sipnip leverages the unique superpowers of the Sui Blockchain:

1. **Programmable Transaction Blocks (PTB):**
   - Multi-step operations (e.g., split coins, create escrow, and notify) are composed into a single atomic transaction block. Either all steps succeed, or none do.
2. **Object-Centric Move Smart Contracts:**
   - Instead of fragile EVM balances, Sipnip uses native Sui shared objects (`Escrow has key, store`) with custom event emissions for decentralized payments.
3. **Sub-Second Finality & Low Fees:**
   - Real-time balance updates and near-instant settlement via Sui Testnet GraphQL RPC.
4. **Live On-Chain Querying:**
   - Real-time recent transaction tracking with live net SUI deltas, relative timestamps, and one-click [Suiscan](https://suiscan.xyz) explorer verification.

---

## 🏗️ Architecture & Data Flow

```
   ┌────────────────────────────────────────────────────────┐
   │                  User (Natural Chat)                   │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │            AI Agent Engine (Google Gemini)             │
   │   • Intent Extraction (Transfer, Escrow, Swap, Batch)  │
   │   • Multi-Turn Context Memory & SuiNS Resolution       │
   └───────────────────────────┬────────────────────────────┘
                               │ Structured JSON Action
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │              Human-in-the-Loop Review Card             │
   │   • Recipient address, amount, purpose breakdown       │
   │   • Smooth Framer Motion spring physics morphing       │
   └───────────────────────────┬────────────────────────────┘
                               │ User Approves
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │        Sui Wallet Standard (Slush / Sui Wallet)        │
   │   • Client-side transaction signing (Zero Agent Keys)  │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │              Sui Testnet Blockchain                    │
   │   • Atomic PTB Execution                               │
   │   • Native Move Escrow Shared Objects                  │
   │   • Event Emission (EscrowCreated, EscrowReleased)     │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │           Live Sui GraphQL RPC Sync Engine             │
   │   • Live Balance & Activity Fetching                   │
   │   • Direct Suiscan Explorer Links                      │
   └────────────────────────────────────────────────────────┘
```

---

## 📜 Verified On-Chain Deployments (Sui Testnet)

The Sipnip Escrow contract is compiled with Sui Move and deployed on **Sui Testnet**:

| Parameter | Details |
| :--- | :--- |
| **Package ID** | [`0xa1cb6dc073981bb0d28aa2281afa3d434295666972a60b5410e49a005acf08a6`](https://suiscan.xyz/testnet/package/0xa1cb6dc073981bb0d28aa2281afa3d434295666972a60b5410e49a005acf08a6) |
| **Deployer Wallet** | `0x5a74b232069d7114400321fb89116192f219a32d3849f233928157aac5afc7b3` |
| **Move Module** | `sipnip::escrow` |
| **Functions** | `create_escrow`, `deposit`, `release_payment`, `refund` |

### Verified End-to-End Test Transactions:
- **Create Escrow Transaction:** [`8z3TxMuEyAuCTZvKwz1eAcLyW25ZbYhtcVAAd1P76KmQ`](https://suiscan.xyz/testnet/tx/8z3TxMuEyAuCTZvKwz1eAcLyW25ZbYhtcVAAd1P76KmQ)
- **Release Payment Transaction:** [`AbNdWG4K9os8FAFn3sSd5TZ7pG1h2nUAQVndmNoQWF8E`](https://suiscan.xyz/testnet/tx/AbNdWG4K9os8FAFn3sSd5TZ7pG1h2nUAQVndmNoQWF8E)

---

## 📁 Repository Structure

```text
Sipnip/
├── frontend/             # React + Vite + Tailwind + Framer Motion Web App
│   ├── src/
│   │   ├── api.ts        # Sui GraphQL RPC queries & Gemini AI fallback logic
│   │   ├── components/   # Dashboard, ChatWindow, ActionPreview, ConnectModal
│   │   └── types.ts      # TypeScript definitions for actions, state, and cards
│   └── package.json
├── contracts/            # Sui Move Smart Contracts & Integration Server
│   ├── sources/
│   │   └── escrow.move   # Move escrow implementation (shared objects & events)
│   ├── server.js         # Express integration server for backend operations
│   ├── Move.toml         # Sui package configuration
│   └── DEPLOYMENT.md     # Testnet deployment log & verified explorer links
├── agent/                # Standalone AI NLU & Intent Parser
│   ├── src/agent/        # Gemini multi-turn conversation & PTB generator
│   └── AI_INTEGRATION.md # API specification for AI-to-Blockchain actions
├── demo/                 # Hackathon pitch materials & 3-minute live script
│   └── DEMO_SCRIPT.md    # 3-minute live demonstration script
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- A Sui Wallet extension installed in your browser (e.g. [Slush](https://slushwallet.com/) or [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil)) set to **Sui Testnet**.

### 1. Clone the Repository
```bash
git clone https://github.com/lokieed/Sipnip.git
cd Sipnip
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Optional: Add your Gemini API key to .env
# VITE_GEMINI_API_KEY="your_api_key_here"

npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. (Optional) Run Integration Server
```bash
cd ../contracts
npm install
node server.js
```
The integration server runs on `http://localhost:3001`.

---

## 👥 The Team

| Team Member | Role | Focus Area |
| :--- | :--- | :--- |
| **Nathan Chua Jia Shen** | UI/UX & Frontend Lead | Framer Motion shape morphing, design system, live GraphQL UI |
| **Norman Lim Yi Hau** | AI Agent & NLU Lead | Gemini intent parsing, multi-turn memory, action schemas |
| **Nicole Chua Jia Xing** | Sui Blockchain Lead | Sui Move escrow smart contract, testnet deployment, PTBs |
| **Yap Chung Chuen** | Integration & Demo Lead | Cross-tier pipeline, demo script rehearsal, video walkthrough |

---

## 🛡️ Security & Guardrails

- **Zero Private Key Custody:** The AI agent **never** accesses or stores private keys.
- **Explicit Confirmation:** No transactions can be broadcasted without explicit user approval in the modal review card.
- **Formal Verification Ready:** Written in type-safe Sui Move with explicit sender assertions (`assert!(recipient != sender, EInvalidRecipient)`).
- **Graceful RPC Fallback:** When GraphQL endpoints experience rate limiting, client state handles fallbacks without crashing.

---

<div align="center">
  <sub>Built with ❤️ at MUBA Blockchain Hackathon 2026.</sub>
</div>
