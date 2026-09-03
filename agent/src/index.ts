import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { parseUserIntent } from "./agent/parser.js";
import { ChatMessage } from "./types/actions.js";

export * from "./types/actions.js";
export { parseUserIntent } from "./agent/parser.js";

async function main() {
  const rl = readline.createInterface({ input, output });
  const conversationHistory: ChatMessage[] = [];

  console.log(
    "\n╔═════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║        🤖 SIPNIP AI WALLET AGENT — SUI PTB & MEMORY REPL        ║",
  );
  console.log(
    "╚═════════════════════════════════════════════════════════════════╝",
  );
  console.log("Features active:");
  console.log(
    "  ⚡ Sui Programmable Transaction Blocks (PTBs / Chained Batch)",
  );
  console.log("  🧠 Multi-Turn Conversational Memory (Follow-ups)");
  console.log("  🏷️ SuiNS (.sui domain) recipient detection");
  console.log("  🛡️ Safety Previews before wallet signing");
  console.log("\nTry typing:");
  console.log(
    '  • "Swap 10 SUI to USDC and send 5 USDC to alice.sui" (Tests Sui PTB!)',
  );
  console.log(
    '  • "Send SUI to bob.sui", then follow up with "5 SUI" (Tests Memory!)',
  );
  console.log('Type "clear" to reset memory, or "exit" to quit.\n');

  while (true) {
    const userInput = await rl.question("💬 You: ");
    const trimmed = userInput.trim();

    if (trimmed.toLowerCase() === "exit") {
      console.log("\n👋 Exiting Sipnip AI Agent. Goodbye!\n");
      rl.close();
      break;
    }

    if (trimmed.toLowerCase() === "clear") {
      conversationHistory.length = 0;
      console.log("🧹 Conversation memory reset.\n");
      continue;
    }

    console.log("⏳ Processing with Gemini 3.5 Flash...");
    const result = await parseUserIntent(userInput, conversationHistory);

    // Record turns in memory for follow-up questions
    conversationHistory.push({ role: "user", text: userInput });
    conversationHistory.push({
      role: "model",
      text: JSON.stringify({ action: result.action, message: result.message }),
    });

    console.log(`\n💬 AI: "${result.message}"`);
    console.log("\n📦 Structured Action (for Member 4 & 3):");
    console.log(JSON.stringify(result.action, null, 2));

    if (
      "requiresConfirmation" in result.action &&
      result.action.requiresConfirmation
    ) {
      console.log(`\n🛡️ Safety Preview: "${result.action.summary}"`);
      console.log(
        "👉 Ready for Member 4 backend & Member 1 UI wallet signing.\n",
      );
    } else {
      console.log("\n");
    }
  }
}

main().catch(console.error);
