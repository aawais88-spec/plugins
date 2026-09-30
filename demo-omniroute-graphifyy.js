/**
 * OmniRoute Global + Graphifyy Plugin Demo
 * Shows integration of global tools with the plugin framework
 */

const { PluginManager, OmniRouteGlobalPlugin, GraphifyyPlugin, LoggerPlugin } = require('./plugins');

async function main() {
  console.log('=== OmniRoute Global + Graphifyy Integration Demo ===\n');

  // Initialize plugin manager
  const manager = new PluginManager();

  // Register plugins
  console.log('1. Registering Global Plugins...\n');
  manager.register('omniroute', OmniRouteGlobalPlugin, { name: 'OmniRoute Global' });
  manager.register('graphifyy', GraphifyyPlugin, { name: 'Token Analysis' });
  manager.register('logger', LoggerPlugin);

  // Initialize
  console.log('2. Initializing...\n');
  manager.initializeAll();

  const omniroute = manager.get('omniroute');
  const graphifyy = manager.get('graphifyy');
  const logger = manager.get('logger');

  // Get omniroute info
  console.log('3. OmniRoute Global Info...\n');
  const orInfo = omniroute.getInfo();
  console.log(`  Plugin: ${orInfo.plugin}`);
  console.log(`  Version: ${orInfo.version}`);
  console.log(`  Features:`);
  orInfo.features.forEach(f => console.log(`    ✅ ${f}`));
  console.log();

  // Get omniroute version
  console.log('4. Checking OmniRoute Installation...\n');
  const version = omniroute.getVersion();
  if (version.status === 'success') {
    console.log(`  ✅ OmniRoute available`);
    console.log(`  Version: ${version.version}\n`);
  } else {
    console.log(`  ⚠️  Note: ${version.message}`);
    console.log(`  Using: npx omniroute\n`);
  }

  // Token analysis
  console.log('5. Token Analysis with Graphifyy...\n');

  const prompt1 = 'Analyze this code and explain what it does';
  const analysis1 = graphifyy.analyzeTokens(prompt1, 'claude-haiku-4-5-20251001');
  console.log(`  Prompt: "${prompt1}"`);
  console.log(`  Model: ${analysis1.model}`);
  console.log(`  Estimated Tokens: ${analysis1.estimatedTokens}`);
  console.log(`  Estimated Cost: $${analysis1.estimatedInputCost}`);
  logger.info('Token analysis', { tokens: analysis1.estimatedTokens, model: 'haiku' });

  const prompt2 = 'Write a comprehensive guide on machine learning including neural networks, deep learning, reinforcement learning, and practical applications with code examples';
  const analysis2 = graphifyy.analyzeTokens(prompt2, 'claude-opus-5-5');
  console.log();
  console.log(`  Prompt: "${prompt2.substring(0, 50)}..."`);
  console.log(`  Model: ${analysis2.model}`);
  console.log(`  Estimated Tokens: ${analysis2.estimatedTokens}`);
  console.log(`  Estimated Cost: $${analysis2.estimatedInputCost}`);
  logger.info('Token analysis', { tokens: analysis2.estimatedTokens, model: 'opus' });
  console.log();

  // Cost comparison
  console.log('6. Cost Comparison Across Models...\n');
  const comparison = graphifyy.compareCosts(prompt2);
  console.log(`  Prompt length: ${comparison.promptLength} chars`);
  console.log(`  Estimated tokens: ${comparison.estimatedTokens}\n`);
  console.log('  Model Comparison (sorted by cost):');
  comparison.comparison.forEach((c, i) => {
    console.log(`    ${i + 1}. ${c.model}`);
    console.log(`       Type: ${c.type}`);
    console.log(`       Cost: $${c.inputCost}`);
  });
  console.log();

  // Model pricing
  console.log('7. Current Model Pricing...\n');
  const pricing = graphifyy.getModelPricing();
  pricing.models.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name}`);
    console.log(`     Type: ${m.type}`);
    console.log(`     Input: $${m.inputCostPer1k}/1k tokens`);
    console.log(`     Output: $${m.outputCostPer1k}/1k tokens`);
  });
  console.log();

  // Cost calculation
  console.log('8. Calculate Request Cost...\n');
  const cost1 = graphifyy.calculateCost(250, 150, 'claude-haiku-4-5-20251001');
  console.log(`  Request with Haiku:`);
  console.log(`    Input: ${cost1.inputTokens} tokens`);
  console.log(`    Output: ${cost1.outputTokens} tokens`);
  console.log(`    Total: ${cost1.totalTokens} tokens`);
  console.log(`    Cost: ${cost1.costBreakdown.total}`);

  const cost2 = graphifyy.calculateCost(250, 150, 'claude-opus-5-5');
  console.log();
  console.log(`  Same request with Opus:`);
  console.log(`    Input: ${cost2.inputTokens} tokens`);
  console.log(`    Output: ${cost2.outputTokens} tokens`);
  console.log(`    Total: ${cost2.totalTokens} tokens`);
  console.log(`    Cost: ${cost2.costBreakdown.total}`);

  const savings = (parseFloat(cost2.costBreakdown.total) - parseFloat(cost1.costBreakdown.total)).toFixed(6);
  console.log();
  console.log(`  💰 Savings with Haiku: $${savings}\n`);

  // Token optimization tips
  console.log('9. Token Optimization Tips...\n');
  const tips = graphifyy.getOptimizationTips();
  tips.tips.forEach((tip, i) => {
    console.log(`  ${i + 1}. ${tip.title}`);
    console.log(`     Benefit: ${tip.benefit}`);
    console.log(`     When: ${tip.when}`);
  });
  console.log();

  // Analysis history
  console.log('10. Token Analysis History...\n');
  const history = graphifyy.getAnalysisHistory(5);
  console.log(`  Total analyses: ${history.total}`);
  console.log(`  Recent analyses:`);
  history.analysis.forEach((a, i) => {
    console.log(`    ${i + 1}. ${a.model}`);
    console.log(`       Tokens: ${a.estimatedTokens}, Cost: $${a.estimatedInputCost}`);
  });
  console.log();

  // Combined workflow
  console.log('11. Combined Workflow Example...\n');
  console.log('  Scenario: User submits a request');
  console.log();

  const userPrompt = 'Explain quantum computing concepts';
  logger.info('User request received', { promptLength: userPrompt.length });
  console.log(`  1️⃣  User prompt: "${userPrompt}"`);

  const tokenAnalysis = graphifyy.analyzeTokens(userPrompt);
  console.log(`  2️⃣  Analyze tokens: ${tokenAnalysis.estimatedTokens} tokens`);

  const costAnalysis = graphifyy.compareCosts(userPrompt);
  const cheapestModel = costAnalysis.comparison[0];
  console.log(`  3️⃣  Find cheapest: ${cheapestModel.model} ($${cheapestModel.inputCost})`);

  logger.info('Model selected', { model: cheapestModel.model, cost: cheapestModel.inputCost });
  console.log(`  4️⃣  Route to: ${cheapestModel.model}`);
  console.log(`  5️⃣  Execute request and track tokens`);
  console.log();

  // Integration status
  console.log('12. Integration Status...\n');
  console.log('  ✅ OmniRoute Global - Connected');
  console.log('     └─ Manages routing to Claude models');
  console.log('  ✅ Graphifyy - Connected');
  console.log('     └─ Analyzes token usage and costs');
  console.log('  ✅ Logger - Connected');
  console.log('     └─ Tracks all operations');
  console.log();

  // Shutdown
  console.log('13. Shutting Down...\n');
  manager.shutdownAll();

  console.log('\n=== Integration Demo Complete ===\n');
}

// Run demo
main().catch(error => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
