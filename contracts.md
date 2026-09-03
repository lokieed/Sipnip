# API Contract — P2 (AI) ↔ P3 (Sui)

## 1. Supported AI Commands & Blockchain Payloads

### A. Create Escrow (`sipnip::escrow::create_escrow`)
**Sent to `POST /action` or `POST /escrow`:**
```json
{
  "action": "createEscrow",
  "recipient": "0x5a74... / Alice",
  "amount": 5,
  "description": "website design",
  "currency": "SUI"
}
```

### B. Direct Transfer (`prepareTransaction`)
**Sent to `POST /action` or `POST /prepare`:**
```json
{
  "action": "prepareTransaction",
  "recipient": "0x5a74... / Ahmad",
  "amount": 5,
  "purpose": "design work"
}
```

### C. Check Balance (`checkBalance`)
**Sent to `POST /action` or `GET /balance`:**
```json
{
  "action": "checkBalance",
  "address": "0x5a74b232069d7114400321fb89116192f219a32d3849f233928157aac5afc7b3"
}
```

### D. Release Escrow Payment (`releasePayment`)
```json
{
  "action": "releasePayment",
  "escrowId": "escrow_123456789",
  "recipient": "0x5a74...",
  "amount": 5
}
```

### E. Refund Escrow (`refund`)
```json
{
  "action": "refund",
  "escrowId": "escrow_123456789",
  "sender": "0x5a74...",
  "amount": 5
}
```

---

## 2. What Blockchain returns to AI / UI:
```json
{
  "status": "ready" | "escrow_created" | "payment_released" | "refunded",
  "txHash": "0x123...",
  "explorerLink": "https://suiscan.xyz/testnet/tx/...",
  "message": "Escrow created! 5 SUI locked for website design"
}
```

---

## 3. Agreed by:
- P2 (Norman Lim - AI): [x] Agreed
- P3 (Nicole Chua - Sui): [x] Agreed
