# API Contract — P2 (AI) ↔ P3 (Sui)

## What AI sends to Blockchain:
{
  "action": "createEscrow",
  "params": {
    "amount": 5,
    "recipient": "0xABC...",
    "currency": "SUI"
  }
}

## What Blockchain returns to AI:
{
  "status": "success",
  "txHash": "0x123...",
  "explorerLink": "https://suiexplorer.com/..."
}

## Agreed by:
- P2 (AI): [ ]
- P3 (Sui): [ ]
