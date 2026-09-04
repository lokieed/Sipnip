// =============================================
// SIPNIP — Sui Blockchain Layer
// All functions P2 (AI Agent) will call
// =============================================
//
// NOTE: @mysten/sui v2.x deprecated the old JSON-RPC client for public
// fullnodes (it now errors with "Method not found"). This uses the new
// gRPC client instead, per https://sdk.mystenlabs.com/typescript.
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';

const SUI_GRAPHQL =
  'https://graphql.testnet.sui.io/graphql';

const WALLET_ADDRESS =
  process.env.SUI_WALLET_ADDRESS ||
  '0x5a74b232069d7114400321fb89116192f219a32d3849f233928157aac5afc7b3';

const EXPLORER_BASE =
  'https://suiscan.xyz/testnet/account';

// The deployed escrow Move package (see contracts/DEPLOYMENT.md)
const PACKAGE_ID =
  process.env.SUI_PACKAGE_ID ||
  '0xa1cb6dc073981bb0d28aa2281afa3d434295666972a60b5410e49a005acf08a6';
const MODULE = 'escrow';

const suiClient = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
});

/**
 * Loads the signing wallet from SUI_PRIVATE_KEY (a `suiprivkey1...` string,
 * exported with `sui keytool export --key-identity <alias-or-address>`).
 * This is the shared team wallet signing on behalf of the AI agent for the
 * hackathon demo. A production version would have each user sign their own
 * transactions (e.g. via zkLogin) instead of one shared custodial key.
 */
function loadSigner() {
  const raw = process.env.SUI_PRIVATE_KEY;
  if (!raw) {
    throw new Error(
      'SUI_PRIVATE_KEY is not set. Export it with `sui keytool export --key-identity <alias-or-address>` and put it in contracts/.env (never commit it).'
    );
  }
  const { scheme, secretKey } = decodeSuiPrivateKey(raw);
  if (scheme !== 'ED25519') {
    throw new Error(`Expected an ed25519 key, got ${scheme}.`);
  }
  return Ed25519Keypair.fromSecretKey(secretKey);
}

function suiToMist(amount) {
  return BigInt(Math.round(amount * 1_000_000_000));
}

function txExplorerLink(digest) {
  return `https://suiscan.xyz/testnet/tx/${digest}`;
}

/**
 * Builds, signs and submits a transaction, requesting effects + events back.
 * Returns a normalized { success, digest, error, events } shape regardless
 * of SDK version quirks, so the rest of this file doesn't need to know
 * about the underlying gRPC response format.
 */
async function signAndExecute(tx, signer) {
  tx.setSenderIfNotSet(signer.toSuiAddress());
  const bytes = await tx.build({ client: suiClient });
  const { signature } = await signer.signTransaction(bytes);

  const response = await suiClient.core.executeTransaction({
    transaction: bytes,
    signatures: [signature],
    include: { effects: true, events: true },
  });

  const success = response.$kind === 'Transaction';
  const body = success ? response.Transaction : response.FailedTransaction;

  return {
    success,
    digest: body?.digest,
    error: success ? null : (body?.status?.error?.message || 'Transaction failed'),
    events: body?.events || [],
  };
}

/** Pulls the EscrowCreated/Released/Refunded event's parsed JSON out of a result, if any. */
function findEscrowEvent(result) {
  const event = result.events.find((e) => e.eventType?.includes(`${MODULE}::Escrow`));
  return event?.json ?? null;
}

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
      explorerLink: `${EXPLORER_BASE}/${address}`
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
      explorerLink: `${EXPLORER_BASE}/${address}`
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
// Locks payment on-chain via the deployed Move contract
// (sipnip::escrow::create_escrow)
// ─────────────────────────────────────────
export async function createEscrow(
  recipientAddress, amountInSUI, description
) {
  try {
    const signer = loadSigner();
    const tx = new Transaction();
    const [payment] = tx.splitCoins(tx.gas, [suiToMist(amountInSUI)]);
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::create_escrow`,
      arguments: [payment, tx.pure.address(recipientAddress)],
    });

    const result = await signAndExecute(tx, signer);
    const event = findEscrowEvent(result);

    if (!result.success) {
      return { status: 'error', message: result.error };
    }

    console.log(`🔒 Escrow created: ${amountInSUI} SUI`);
    console.log(`📦 Escrow object ID: ${event?.escrow_id}`);
    console.log(`👤 Recipient: ${recipientAddress}`);
    console.log(`📝 For: ${description}`);

    return {
      status: 'escrow_created',
      escrowId: event?.escrow_id,
      amount: amountInSUI,
      recipient: recipientAddress,
      description: description,
      txHash: result.digest,
      explorerLink: txExplorerLink(result.digest),
      timestamp: new Date().toISOString(),
      message: `Escrow created! ${amountInSUI} SUI locked for ${description}`
    };
  } catch (error) {
    console.error('createEscrow failed:', error);
    return { status: 'error', message: error.message };
  }
}

// ─────────────────────────────────────────
// FUNCTION 5: Release Payment from Escrow
// (sipnip::escrow::release_payment)
// ─────────────────────────────────────────
export async function releasePayment(
  escrowId, recipientAddress, amountInSUI
) {
  try {
    const signer = loadSigner();
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::release_payment`,
      arguments: [tx.object(escrowId)],
    });

    const result = await signAndExecute(tx, signer);
    const event = findEscrowEvent(result);

    if (!result.success) {
      return { status: 'error', message: result.error };
    }

    const finalAmount = event?.amount ? Number(event.amount) / 1_000_000_000 : amountInSUI;
    const finalRecipient = event?.recipient || recipientAddress;

    console.log(`🚀 Released escrow ${escrowId}`);
    console.log(`💸 Sent ${finalAmount} SUI → ${finalRecipient}`);

    return {
      status: 'payment_released',
      escrowId: escrowId,
      amount: finalAmount,
      recipient: finalRecipient,
      txHash: result.digest,
      explorerLink: txExplorerLink(result.digest),
      timestamp: new Date().toISOString(),
      message: `Payment released! ${finalAmount} SUI sent to ${finalRecipient}`
    };
  } catch (error) {
    console.error('releasePayment failed:', error);
    return { status: 'error', message: error.message };
  }
}

// ─────────────────────────────────────────
// FUNCTION 6: Refund
// (sipnip::escrow::refund)
// ─────────────────────────────────────────
export async function refund(escrowId, senderAddress, amountInSUI) {
  try {
    const signer = loadSigner();
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::refund`,
      arguments: [tx.object(escrowId)],
    });

    const result = await signAndExecute(tx, signer);
    const event = findEscrowEvent(result);

    if (!result.success) {
      return { status: 'error', message: result.error };
    }

    const finalAmount = event?.amount ? Number(event.amount) / 1_000_000_000 : amountInSUI;
    const finalSender = event?.sender || senderAddress;

    console.log(`↩️ Refunded escrow ${escrowId}`);
    console.log(`💸 Returned ${finalAmount} SUI → ${finalSender}`);

    return {
      status: 'refunded',
      escrowId: escrowId,
      amount: finalAmount,
      returnedTo: finalSender,
      txHash: result.digest,
      explorerLink: txExplorerLink(result.digest),
      timestamp: new Date().toISOString(),
      message: `Refunded! ${finalAmount} SUI returned to ${finalSender}`
    };
  } catch (error) {
    console.error('refund failed:', error);
    return { status: 'error', message: error.message };
  }
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
// Only runs when this file is executed directly
// (`node contracts/index.js`), NOT when server.js
// imports these functions — otherwise every server
// restart would fire real testnet transactions.
// ─────────────────────────────────────────
async function runTests() {
  console.log('=================================');
  console.log('🧪 SIPNIP BLOCKCHAIN LAYER TEST');
  console.log('=================================\n');

  console.log('TEST 1: Check Balance');
  const balance = await checkBalance(WALLET_ADDRESS);
  console.log(JSON.stringify(balance, null, 2));

  console.log('\nTEST 2: Create Escrow (real on-chain tx)');
  // Contract requires recipient != sender, so we need a second address here.
  // This is Nicole's own test address from CLI setup - swap for any other
  // valid 0x... address if you'd rather use a different one.
  const TEST_RECIPIENT = '0xf380f25849f44ab37446eb28ef069125b70559e4a3386149662eafa81b699844';
  const escrow = await createEscrow(
    TEST_RECIPIENT,
    0.01,
    'Design work payment'
  );
  console.log(JSON.stringify(escrow, null, 2));

  if (escrow.status === 'escrow_created') {
    console.log('\nWaiting a few seconds for the new escrow object to propagate...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('\nTEST 3: Release that escrow (real on-chain tx)');
    const released = await releasePayment(escrow.escrowId, WALLET_ADDRESS, 0.01);
    console.log(JSON.stringify(released, null, 2));
  }

  console.log('\n=================================');
  console.log('✅ ALL TESTS COMPLETE!');
  console.log('=================================');
}

// Cross-platform-safe "am I the entry point?" check (the naive
// import.meta.url === file://+argv[1] comparison breaks on Windows
// because of backslash vs forward-slash paths).
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runTests();
}