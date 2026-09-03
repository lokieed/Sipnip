import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { parseUserIntent } from './agent/parser.js';
import { toBlockchainServerCommand } from './agent/bridge.js';
import { ChatMessage } from './types/actions.js';

export * from './types/actions.js';
export { parseUserIntent } from './agent/parser.js';
export { toBlockchainServerCommand, sendToContractsServer } from './agent/bridge.js';

async function main() {
  const rl = readline.createInterface({ input, output });
  const conversationHistory: ChatMessage[] = [];

  console.log('\n╔═════════════════════════════════════════════════════════════════╗');
  console.log('║   🤖 SIPNIP AI AGENT — FULL MOVE CONTRACT COMPATIBILITY REPL    ║');
  console.log('╚═════════════════════════════════════════════════════════════════╝');
  console.log('Features active:');
  console.log('  🔒 Sui Move Escrow (create_escrow, release_payment, refund)');
  console.log('  ⚡ Sui Programmable Transaction Blocks (PTBs / Chained Batch)');
  console.log('  🧠 Multi-Turn Conversational Memory (Follow-ups)');
  console.log('  🏷️ SuiNS (.sui domain) recipient detection');
  console.log('  🛡️ Safety Previews before wallet signing');
  console.log('\nTry typing:');
  console.log('  • "Create an escrow of 5 SUI for Alice for website design"');
  console.log('  • "Send 5 SUI to Ahmad for design work"');
  console.log('  • "Swap 10 SUI to USDC and send 5 USDC to alice.sui"');
  console.log('  • "Release payment of 5 SUI for escrow_123 to Alice"');
  console.log('Type "clear" to reset memory, or "exit" to quit.\n');

  while (true) {
    const userInput = await rl.question('💬 You: ');
    const trimmed = userInput.trim();

    if (trimmed.toLowerCase() === 'exit') {
      console.log('\n👋 Exiting Sipnip AI Agent. Goodbye!\n');
      rl.close();
      break;
    }

    if (trimmed.toLowerCase() === 'clear') {
      conversationHistory.length = 0;
      console.log('🧹 Conversation memory reset.\n');
      continue;
    }

    console.log('⏳ Processing with Gemini 3.5 Flash...');
    const result = await parseUserIntent(userInput, conversationHistory);

    // Record turns in memory for follow-up questions
    conversationHistory.push({ role: 'user', text: userInput });
    conversationHistory.push({
      role: 'model',
      text: JSON.stringify({ action: result.action, message: result.message }),
    });

    console.log(`\n💬 AI: "${result.message}"`);
    console.log('\n📦 Structured AI Action:');
    console.log(JSON.stringify(result.action, null, 2));

    // Convert to Nicole's Blockchain Server Command
    const contractCommand = toBlockchainServerCommand(result.action);
    if (contractCommand) {
      console.log('\n🔗 Sui Contracts Payload (contracts/server.js POST /action):');
      console.log(JSON.stringify(contractCommand, null, 2));
    }

    if ('requiresConfirmation' in result.action && result.action.requiresConfirmation) {
      console.log(`\n🛡️ Safety Preview: "${result.action.summary}"`);
      console.log('👉 Ready for Member 4 backend & Member 1 UI wallet signing.\n');
    } else {
      console.log('\n');
    }
  }
}

main().catch(console.error);
