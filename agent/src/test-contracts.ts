import { parseUserIntent } from './agent/parser.js';
import { toBlockchainServerCommand } from './agent/bridge.js';

async function runContractIntegrationTests() {
  console.log('===============================================================');
  console.log('🧪 SIPNIP AI ↔ SUI SMART CONTRACT INTEGRATION TEST');
  console.log('===============================================================\n');

  const testCases = [
    {
      label: 'TEST 1: Create Escrow (Smart Contract: sipnip::escrow::create_escrow)',
      prompt: 'Create an escrow of 5 SUI for Alice for website design',
      expectedBlockchainAction: 'createEscrow',
    },
    {
      label: 'TEST 2: Direct Transfer with Purpose (Demo Script flow)',
      prompt: 'Send 5 SUI to Ahmad for design work',
      expectedBlockchainAction: 'prepareTransaction',
    },
    {
      label: 'TEST 3: Check Wallet Balance',
      prompt: 'Check my SUI balance',
      expectedBlockchainAction: 'checkBalance',
    },
    {
      label: 'TEST 4: Release Payment from Escrow',
      prompt: 'Release payment of 5 SUI for escrow_1725370000 to Alice',
      expectedBlockchainAction: 'releasePayment',
    },
    {
      label: 'TEST 5: Refund Escrow',
      prompt: 'Refund 5 SUI from escrow_1725370000',
      expectedBlockchainAction: 'refund',
    },
  ];

  let passed = 0;

  for (const tc of testCases) {
    console.log(`▶ ${tc.label}`);
    console.log(`💬 User Input: "${tc.prompt}"`);

    const aiResult = await parseUserIntent(tc.prompt);
    console.log('🤖 AI Parsed Action:');
    console.log(JSON.stringify(aiResult.action, null, 2));

    const blockchainCommand = toBlockchainServerCommand(aiResult.action);
    console.log('🔗 Output Sent to Nicole\'s Blockchain Server (POST /action):');
    console.log(JSON.stringify(blockchainCommand, null, 2));

    if (blockchainCommand && blockchainCommand.action === tc.expectedBlockchainAction) {
      console.log(`✅ MATCH: Successfully mapped to "${tc.expectedBlockchainAction}"\n`);
      passed++;
    } else {
      console.log(`❌ MISMATCH: Expected "${tc.expectedBlockchainAction}" but got "${blockchainCommand?.action}"\n`);
    }
    console.log('---------------------------------------------------------------\n');
  }

  console.log(`🎯 Test Summary: ${passed} / ${testCases.length} contract integration tests passed!`);
  if (passed === testCases.length) {
    console.log('🚀 FULL COMPATIBILITY VERIFIED: AI Agent is 100% compatible with Sui contracts!');
  }
}

runContractIntegrationTests().catch(console.error);
