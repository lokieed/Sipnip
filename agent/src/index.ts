import { parseUserIntent } from './agent/parser.js';

async function runDemo() {
  console.log('🤖 === AI WALLET AGENT: STRUCTURED INTENT TEST ===\n');

  const testPrompts = [
    'Send Alice 5 SUI.',
    'How much SUI do I have in my wallet?',
    'Show my recent transactions.',
    'Transfer 2.5 USDC to 0x1234567890abcdef',
    'What is the weather in Paris today?', // Off-topic / unknown test
  ];

  for (const prompt of testPrompts) {
    console.log(`User Input: "${prompt}"`);
    const result = await parseUserIntent(prompt);
    console.log('Structured Action Output:');
    console.log(JSON.stringify(result.action, null, 2));
    console.log('--------------------------------------------------\n');
  }

  console.log('✅ Structured Action testing complete!');
}

runDemo();
