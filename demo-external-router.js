/**
 * External Router Plugin Demo
 * Shows multi-provider routing, switches, and fallback chains
 */

const { PluginManager, OmniRoutePlugin, ExternalRouterPlugin, LoggerPlugin, DatabasePlugin } = require('./plugins');

async function main() {
  console.log('=== External Router Plugin Demo ===\n');

  // Initialize plugin manager
  const manager = new PluginManager();

  // Register plugins
  console.log('1. Registering Plugins...\n');
  manager.register('router', OmniRoutePlugin);
  manager.register('external', ExternalRouterPlugin, { name: 'Multi-Provider Router' });
  manager.register('logger', LoggerPlugin);
  manager.register('db', DatabasePlugin);

  // Initialize
  console.log('2. Initializing Plugins...\n');
  manager.initializeAll();

  const router = manager.get('router');
  const external = manager.get('external');
  const logger = manager.get('logger');

  // Register external providers
  console.log('3. Registering External Providers...\n');

  external.registerProvider('openrouter', {
    type: 'api',
    baseURL: 'https://openrouter.io/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || 'mock-key',
    models: {
      'gpt-4': 'openai/gpt-4',
      'claude-3-opus': 'anthropic/claude-3-opus',
      'llama-2-70b': 'meta-llama/llama-2-70b'
    }
  });
  console.log('  ✅ Registered: OpenRouter');

  external.registerProvider('together', {
    type: 'api',
    baseURL: 'https://api.together.xyz/inference',
    apiKey: process.env.TOGETHER_API_KEY || 'mock-key',
    models: {
      'llama-2-70b': 'togethercomputer/llama-2-70b-chat',
      'mistral-7b': 'mistralai/Mistral-7B-Instruct'
    }
  });
  console.log('  ✅ Registered: Together AI');

  external.registerProvider('replicate', {
    type: 'api',
    baseURL: 'https://api.replicate.com/v1',
    apiKey: process.env.REPLICATE_API_KEY || 'mock-key',
    models: {
      'gpt-vision': 'openai/gpt-4-vision',
      'stable-diffusion': 'stability-ai/stable-diffusion'
    }
  });
  console.log('  ✅ Registered: Replicate\n');

  // Add routing rules
  console.log('4. Adding Routing Rules...\n');

  external.addRoutingRule('/api/gpt4', 'openrouter', 'gpt-4');
  console.log('  ✅ Rule 1: /api/gpt4 → OpenRouter/GPT-4');

  external.addRoutingRule('/api/llama', 'together', 'llama-2-70b');
  console.log('  ✅ Rule 2: /api/llama → Together/Llama-70B');

  external.addRoutingRule('/api/mistral', 'together', 'mistral-7b');
  console.log('  ✅ Rule 3: /api/mistral → Together/Mistral-7B\n');

  // Create switches
  console.log('5. Creating Provider Switches...\n');

  external.createSwitch('llm_switch', 'openrouter', 'together', 'provider1');
  console.log('  ✅ Switch created: llm_switch (OpenRouter ↔ Together)');

  const activeStatus = external.getActiveProvider('llm_switch');
  console.log(`  ✅ Active: ${activeStatus.activeProvider}\n`);

  // Add fallback chain
  console.log('6. Adding Fallback Chains...\n');

  external.addFallbackChain('reliable_chain', [
    ['openrouter', 'gpt-4'],
    ['together', 'llama-2-70b'],
    ['replicate', 'gpt-vision']
  ]);
  console.log('  ✅ Fallback chain: GPT-4 → Llama-70B → GPT-Vision\n');

  // Route to providers
  console.log('7. Routing Requests to Providers...\n');

  const gpt4Result = external.routeToProvider('openrouter', 'gpt-4', 'Analyze this code...');
  logger.info('Routed to GPT-4', { provider: 'openrouter', duration: gpt4Result.duration });
  console.log(`  ✅ GPT-4: ${gpt4Result.duration}ms, ${gpt4Result.tokens} tokens`);

  const llamaResult = external.routeToProvider('together', 'llama-2-70b', 'Explain quantum computing...');
  logger.info('Routed to Llama', { provider: 'together', duration: llamaResult.duration });
  console.log(`  ✅ Llama-70B: ${llamaResult.duration}ms, ${llamaResult.tokens} tokens`);

  const mistralResult = external.routeToProvider('together', 'mistral-7b', 'Write a poem...');
  logger.info('Routed to Mistral', { provider: 'together', duration: mistralResult.duration });
  console.log(`  ✅ Mistral-7B: ${mistralResult.duration}ms, ${mistralResult.tokens} tokens\n`);

  // Use fallback chain
  console.log('8. Testing Fallback Chain...\n');
  const fallbackResult = external.routeWithFallback('reliable_chain', 'Complex reasoning task...');
  console.log(`  ✅ Fallback chain result: ${fallbackResult.provider}/${fallbackResult.model}`);
  console.log(`  ✅ Duration: ${fallbackResult.duration}ms, Tokens: ${fallbackResult.tokens}\n`);

  // Test switch
  console.log('9. Testing Provider Switch...\n');
  console.log('  ✅ Current active: openrouter');

  external.toggleSwitch('llm_switch');
  const newActive = external.getActiveProvider('llm_switch');
  console.log(`  ✅ After toggle: ${newActive.activeProvider}\n`);

  // Get all providers
  console.log('10. All Registered Providers:\n');
  const providers = external.listProviders();
  providers.providers.forEach((p, index) => {
    console.log(`  ${index + 1}. ${p.name} (${p.type})`);
    console.log(`     Models: ${Object.keys(p.models).length}`);
    console.log(`     Enabled: ${p.enabled}`);
  });
  console.log();

  // Get all routing rules
  console.log('11. All Routing Rules:\n');
  const routes = external.listRoutes();
  routes.routes.forEach((r, index) => {
    console.log(`  ${index + 1}. ${r.pattern} → ${r.provider}/${r.model}`);
  });
  console.log();

  // Get all switches
  console.log('12. All Switches:\n');
  const switches = external.listSwitches();
  switches.switches.forEach((s, index) => {
    console.log(`  ${index + 1}. ${s.name}: ${s.provider1} ↔ ${s.provider2}`);
    console.log(`     Active: ${s.currentProvider}`);
  });
  console.log();

  // Show usage statistics
  console.log('13. Usage Statistics...\n');
  const stats = external.getUsageStats();
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Total Tokens: ${stats.totalTokens}\n`);
  console.log('  By Provider:');
  for (const [provider, info] of Object.entries(stats.providers)) {
    console.log(`    ${provider}:`);
    console.log(`      Requests: ${info.totalRequests}`);
    console.log(`      Avg Latency: ${info.avgLatency}ms`);
    console.log(`      Success Rate: ${info.successRate}`);
    console.log(`      Tokens: ${info.totalTokens}`);
  }
  console.log();

  // Show usage history
  console.log('14. Recent Usage History (Last 5):\n');
  const history = external.getUsageHistory(5);
  history.history.forEach((h, index) => {
    console.log(`  ${index + 1}. ${h.provider}/${h.model}`);
    console.log(`     Duration: ${h.duration}ms, Tokens: ${h.tokens}`);
    console.log(`     Time: ${h.timestamp}`);
  });
  console.log();

  // Provider status
  console.log('15. Provider Status Details...\n');
  const orStatus = external.getProviderStatus('openrouter');
  console.log(`  OpenRouter:`);
  console.log(`    Status: ${orStatus.status}`);
  console.log(`    Enabled: ${orStatus.enabled}`);
  console.log(`    Avg Latency: ${orStatus.avgLatency}ms`);
  console.log(`    Success Rate: ${orStatus.successRate}`);
  console.log(`    Requests: ${orStatus.totalRequests}`);
  console.log();

  // Shutdown
  console.log('16. Shutting Down...\n');
  manager.shutdownAll();

  console.log('\n=== External Router Demo Complete ===\n');
}

// Run demo
main().catch(error => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
