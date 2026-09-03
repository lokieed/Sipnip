// =============================================
// SIPNIP — Integration Server
// Connects P1 (Frontend) ↔ P2 (AI) ↔ P3 (Blockchain)
// =============================================

import express from 'express';
import cors from 'cors';
import { 
  checkBalance, 
  getWalletInfo,
  prepareTransaction,
  createEscrow,
  releasePayment,
  refund,
  processAICommand
} from './index.js';

const app = express();
const PORT = 3001;

// Allow React app to talk to this server
app.use(cors());
app.use(express.json());

const WALLET_ADDRESS = 
  '0x5a74b232069d7114400321fb89116192f219a32d3849f233928157aac5afc7b3';

// ─────────────────────────────────────────
// ROUTE 1: Health check — is server alive?
// ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ 
    status: 'Sipnip server is running!',
    network: 'Sui Testnet',
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────
// ROUTE 2: Get wallet balance
// P1 calls this to show balance on dashboard
// ─────────────────────────────────────────
app.get('/balance', async (req, res) => {
  const result = await checkBalance(WALLET_ADDRESS);
  res.json(result);
});

// ─────────────────────────────────────────
// ROUTE 3: Process AI command
// P2 calls this after AI understands user intent
// ─────────────────────────────────────────
app.post('/action', async (req, res) => {
  const command = req.body;
  console.log('📨 Received command:', command);
  const result = await processAICommand(command);
  console.log('📤 Sending result:', result);
  res.json(result);
});

// ─────────────────────────────────────────
// ROUTE 4: Create escrow directly
// ─────────────────────────────────────────
app.post('/escrow', async (req, res) => {
  const { recipient, amount, description } = req.body;
  const result = await createEscrow(recipient, amount, description);
  res.json(result);
});

// ─────────────────────────────────────────
// ROUTE 5: Prepare transaction preview
// Shows user what will happen before confirming
// ─────────────────────────────────────────
app.post('/prepare', async (req, res) => {
  const { recipient, amount } = req.body;
  const result = await prepareTransaction('send', recipient, amount);
  res.json(result);
});

// Start the server
app.listen(PORT, () => {
  console.log('');
  console.log('================================');
  console.log('🚀 SIPNIP Server is LIVE!');
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log('================================');
  console.log('');
  console.log('Available routes:');
  console.log(`GET  http://localhost:${PORT}/`);
  console.log(`GET  http://localhost:${PORT}/balance`);
  console.log(`POST http://localhost:${PORT}/action`);
  console.log(`POST http://localhost:${PORT}/escrow`);
  console.log(`POST http://localhost:${PORT}/prepare`);
  console.log('');
  console.log('Waiting for requests...');
});
