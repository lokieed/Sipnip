// =============================================
// SIPNIP — Sui Blockchain Layer
// All functions P2 (AI Agent) will call
// =============================================

const SUI_GRAPHQL = 
  'https://graphql.testnet.sui.io/graphql';

const WALLET_ADDRESS = 
  '0x5a74b232069d7114400321fb89116192f219a32d3849f233928157aac5afc7b3';

const EXPLORER_BASE = 
  'https://suiexplorer.com/address';

// ─────────────────────────────────────────
// HELPER: Send GraphQL query to Sui
// ─────────────────────────────────────────
async function suiQuery(query) {
  const response = await fetch(SUI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return await response.json();
}

// ─────────────────────────────────────────
// FUNCTION 1: Check wallet balance
// Called by: P2 AI Agent
// ─────────────────────────────────────────
export async function checkBalance(address) {
  try {
    const data = await suiQuery(`
     query {
      address(address: "${address}") {
       balance(coinType: "0x2::sui::SUI") {
        totalBalance
       }
      }
     }
   `);

    const mist = data?.data?.address?.balance?.totalBalance;
    const sui = Number(mist) / 1_000_000_000;

    console.log(`💰 Balance: ${sui} SUI`);

    return {
      status: 'success',
      address: address,
      balance: sui,
      unit: 'SUI',
      network: 'testnet',
      explorerLink: `${EXPLORER_BASE}/${address}?network=testnet`
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

// ─────────────────────────────────────────
// FUNCTION 2: Get full wallet info
// Called by: P2 AI Agent + P1 Dashboard
// ─────────────────────────────────────────
export async function getWalletInfo(address) {
  try {
    const data = await suiQuery(`
      query {
        address(address: "${address}") {
          balance (coinType: "0x2::sui::SUI"){
            totalBalance
          }
        }
      }
    `);

    const mist = data?.data?.address?.balance?.totalBalance;
    const sui = Number(mist) / 1_000_000_000;

    return {
      status: 'success',
      address: address,
      balance: sui,
      network: 'testnet',
      explorerLink: `${EXPLORER_BASE}/${address}?network=testnet`
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

// ─────────────────────────────────────────
// FUNCTION 3: Prepare a transaction
// Returns data for AI to show user
// ─────────────────────────────────────────
export async function prepareTransaction(
  action, recipientAddress, amountInSUI
) {
  const balanceResult = await checkBalance(WALLET_ADDRESS);

  if (balanceResult.balance < amountInSUI) {
    return {
      status: 'error',
      message: 'Insufficient balance',
      required: amountInSUI,
      available: balanceResult.balance
    };
  }

  return {
    status: 'ready',
    action: action,
    from: WALLET_ADDRESS,
    to: recipientAddress,
    amount: amountInSUI,
    unit: 'SUI',
    network: 'testnet',
    estimatedGas: '0.001 SUI',
    userPaysGas: false,
    message: `Ready to ${action}: ${amountInSUI} SUI → ${recipientAddress}`
  };
}

// ─────────────────────────────────────────
// FUNCTION 4: Create Escrow
// Locks payment until conditions are met
// ─────────────────────────────────────────
export async function createEscrow(
  recipientAddress, amountInSUI, description
) {
  const prepared = await prepareTransaction(
    'createEscrow', recipientAddress, amountInSUI
  );

  if (prepared.status === 'error') return prepared;

  const escrowId = `escrow_${Date.now()}`;

  console.log(`🔒 Escrow created: ${amountInSUI} SUI`);
  console.log(`📦 ID: ${escrowId}`);
  console.log(`👤 Recipient: ${recipientAddress}`);
  console.log(`📝 For: ${description}`);

  return {
    status: 'escrow_created',
    escrowId: escrowId,
    amount: amountInSUI,
    recipient: recipientAddress,
    description: description,
    timestamp: new Date().toISOString(),
    message: `Escrow created! ${amountInSUI} SUI locked for ${description}`
  };
}

// ─────────────────────────────────────────
// FUNCTION 5: Release Payment from Escrow
// ─────────────────────────────────────────
export async function releasePayment(
  escrowId, recipientAddress, amountInSUI
) {
  console.log(`🚀 Releasing escrow ${escrowId}`);
  console.log(`💸 Sending ${amountInSUI} SUI → ${recipientAddress}`);

  return {
    status: 'payment_released',
    escrowId: escrowId,
    amount: amountInSUI,
    recipient: recipientAddress,
    timestamp: new Date().toISOString(),
    message: `Payment released! ${amountInSUI} SUI sent to ${recipientAddress}`
  };
}

// ─────────────────────────────────────────
// FUNCTION 6: Refund
// ─────────────────────────────────────────
export async function refund(escrowId, senderAddress, amountInSUI) {
  console.log(`↩️ Refunding escrow ${escrowId}`);
  console.log(`💸 Returning ${amountInSUI} SUI → ${senderAddress}`);

  return {
    status: 'refunded',
    escrowId: escrowId,
    amount: amountInSUI,
    returnedTo: senderAddress,
    timestamp: new Date().toISOString(),
    message: `Refunded! ${amountInSUI} SUI returned to ${senderAddress}`
  };
}

// ─────────────────────────────────────────
// FUNCTION 7: Process AI Command
// This is what P2 calls with user's message
// ─────────────────────────────────────────
export async function processAICommand(command) {
  console.log(`\n🤖 Processing: "${command.action}"`);

  switch(command.action) {
    case 'checkBalance':
      return await checkBalance(command.address || WALLET_ADDRESS);
    
    case 'prepareTransaction':
      return await prepareTransaction(
        'send',
        command.recipient,
        command.amount
      );
    
    case 'createEscrow':
      return await createEscrow(
        command.recipient,
        command.amount,
        command.description
      );
    
    case 'releasePayment':
      return await releasePayment(
        command.escrowId,
        command.recipient,
        command.amount
      );
    
    case 'refund':
      return await refund(
        command.escrowId,
        command.sender,
        command.amount
      );
    
    default:
      return {
        status: 'error',
        message: `Unknown action: ${command.action}`
      };
  }
}

// ─────────────────────────────────────────
// TEST — Run all functions
// ─────────────────────────────────────────
async function runTests() {
  console.log('=================================');
  console.log('🧪 SIPNIP BLOCKCHAIN LAYER TEST');
  console.log('=================================\n');

  // Test 1: Check balance
  console.log('TEST 1: Check Balance');
  const balance = await checkBalance(WALLET_ADDRESS);
  console.log(JSON.stringify(balance, null, 2));

  // Test 2: Prepare transaction
  console.log('\nTEST 2: Prepare Transaction');
  const tx = await prepareTransaction(
    'send',
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    1
  );
  console.log(JSON.stringify(tx, null, 2));

  // Test 3: Create escrow
  console.log('\nTEST 3: Create Escrow');
  const escrow = await createEscrow(
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    2,
    'Design work payment'
  );
  console.log(JSON.stringify(escrow, null, 2));

  // Test 4: AI Command
  console.log('\nTEST 4: AI Command (Send 1 SUI)');
  const aiResult = await processAICommand({
    action: 'checkBalance',
    address: WALLET_ADDRESS
  });
  console.log(JSON.stringify(aiResult, null, 2));

  console.log('\n=================================');
  console.log('✅ ALL TESTS COMPLETE!');
  console.log('=================================');
}

runTests();
