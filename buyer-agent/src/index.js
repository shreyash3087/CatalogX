'use strict';

/**
 * CatalogX — Buyer Agent CLI Entry Point
 * ========================================
 * Usage:
 *   node src/index.js "Buy me running shoes, size 9, under ₹3000"
 *   node src/index.js  (interactive mode — prompts for instruction)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const readline = require('readline');
const chalk = require('chalk');
const { BuyerAgent } = require('./agent/core');

async function main() {
  let instruction = process.argv.slice(2).join(' ').trim();

  if (!instruction) {
    // Interactive mode
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    instruction = await new Promise((resolve) => {
      console.log(chalk.blue('\n  CatalogX Buyer Agent — Interactive Mode'));
      console.log(chalk.gray('  Examples:'));
      console.log(chalk.gray('    "Buy me running shoes, size 9, under ₹3000"'));
      console.log(chalk.gray('    "Find waterproof hiking boots, size 10, any brand"'));
      console.log(chalk.gray('    "I need casual sneakers, size 8, prefer Nike, budget ₹5000"\n'));
      rl.question(chalk.bold('  Enter your instruction: '), (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    });
  }

  if (!instruction) {
    console.error(chalk.red('  Error: Please provide a shopping instruction.'));
    process.exit(1);
  }

  const agent = new BuyerAgent();
  await agent.run(instruction);
}

main().catch((err) => {
  console.error(chalk.red('\n  Fatal error:'), err.message);
  process.exit(1);
});
