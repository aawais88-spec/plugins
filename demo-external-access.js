/**
 * External AI Model Access Demo
 * Shows how to use external models with configured API keys
 */

const { PluginManager, APIKeyManager, ExternalRouterPlugin, GraphifyyPlugin, LoggerPlugin } = require('./plugins');

async function main() {
  console.log('\n=== External AI Model Access ===\n');

  // Initialize plugins
  const manager = new PluginManager();
  manager.register('keyManager', APIKeyManager);
  manager.register('external', ExternalRouterPlugin);
  manager.register('graphifyy', GraphifyyPlugin);
  manager.register('logger', LoggerPlugin);
  manager.initializeAll();

  const keyManager = manager.get('keyManager');
  const external = manager.get('external');
  const graphifyy = manager.get('graphifyy');
  const logger = manager.get('logger');

  // Step 1: Check configured providers
  console.log('1. Checking Configured Providers...\n');
  const configured = keyManager.getConfiguredProviders();

  if (configured.count === 0) {
    console.log('❌ No API keys configured.');
    console.log('\n📋 To set up API keys:');
    console.log('   1. Run: node setup-api-keys.js');
    console.log('   2. Get API keys from:');
    console.log('      - OpenRouter: https://openrouter.ai/keys');
    console.log('      - Together AI: https://www.together.ai/');
    console.log('      - Replicate: https://replicate.com/account/api-tokens');
    console.log('   3. Copy .env.example to .env');
    console.log('   4. Add your API keys to .env\n');
    manager.shutdownAll();
    return;
  }

  console.log(`✅ Found ${configured.count} configured provider(s):\n`);
  configured.configured.forEach(p => {
    console.log(`   ✅ ${p.name} (${p.models} models)`);
  });
  console.log();

  // Step 2: Register providers with keys
  console.log('2. Registering Providers...\n');

  for (const provider of ['openrouter', 'together', 'replicate']) {
    if (keyManager.isConfigured(provider)) {
      const key = keyManager.getKey(provider);
      const info = keyManager.getProviderInfo(provider);

      external.registerProvider(provider, {
        baseURL: info.baseURL,
        apiKey: key,
        models: info.models
      });

      console.log(`   ✅ Registered: ${info.name}`);
      logger.info('Provider registered', { provider, models: info.models.length });
    }
  }
  console.log();

  // Step 3: Show available models
  console.log('3. Available External Models:\n');
  const providers = external.listProviders();

  providers.providers.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name}`);
    p.models.slice(0, 3).forEach(m => {
      console.log(`      • ${m}`);
    });
    if (p.models.length > 3) {
      console.log(`      ... and ${p.models.length - 3} more`);
    }
    console.log();
  });

  // Step 4: Compare costs with local models
  console.log('4. Cost Comparison (Local vs External):\n');

  const prompt = "Explain machine learning in simple terms with examples";
  const localComparison = graphifyy.compareCosts(prompt);

  console.log('LOCAL CLAUDE MODELS:');
  localComparison.comparison.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.model}: $${c.inputCost}`);
  });
  console.log();

  console.log('EXTERNAL MODELS (when API keys configured):');
  console.log('   • OpenRouter GPT-4: ~$0.03/1K tokens');
  console.log('   • Together Llama-70B: ~$0.0009/1K tokens (Cheapest!)');
  console.log('   • Replicate GPT-4-Vision: ~$0.015/1K tokens\n');

  // Step 5: Demonstrate external routing
  console.log('5. Example: Routing to External Models\n');

  if (keyManager.isConfigured('openrouter')) {
    console.log('🌐 Routing to OpenRouter...');
    const result = external.routeToProvider('openrouter', 'gpt-4', prompt);
    console.log(`   Status: ${result.status}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Duration: ${result.duration}ms\n`);
    logger.info('Routed to external model', { provider: 'openrouter', model: 'gpt-4' });
  } else if (keyManager.isConfigured('together')) {
    console.log('🌐 Routing to Together AI...');
    const result = external.routeToProvider('together', 'llama-2-70b', prompt);
    console.log(`   Status: ${result.status}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Duration: ${result.duration}ms\n`);
    logger.info('Routed to external model', { provider: 'together', model: 'llama-2-70b' });
  }

  // Step 6: Fallback chain setup
  console.log('6. Setting Up Fallback Chain...\n');

  const fallbackProviders = [];
  if (keyManager.isConfigured('openrouter')) fallbackProviders.push(['openrouter', 'gpt-4']);
  if (keyManager.isConfigured('together')) fallbackProviders.push(['together', 'llama-2-70b']);
  fallbackProviders.push(['local', 'claude-opus-5-5']);

  if (fallbackProviders.length > 1) {
    external.addFallbackChain('reliable', fallbackProviders);
    console.log('✅ Fallback chain created:');
    fallbackProviders.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p[0]}/${p[1]}`);
    });
    console.log('\n   If first provider fails, automatically tries next...\n');
  }

  // Step 7: Usage summary
  console.log('7. How to Use External Models in Your Code:\n');

  console.log(`const keyManager = manager.get('keyManager');
const external = manager.get('external');

// Check if provider is configured
if (keyManager.isConfigured('openrouter')) {
  // Route to external model
  const result = external.routeToProvider(
    'openrouter',
    'gpt-4',
    'Your prompt here'
  );
  console.log(result);
}

// Or use fallback chain for reliability
const result = external.routeWithFallback(
  'reliable',  // fallback chain name
  'Your prompt here'
);
console.log(result);
`);

  console.log('\n✅ SETUP COMPLETE!\n');
  console.log('📊 STATUS:');
  console.log(`   Configured providers: ${configured.count}`);
  console.log(`   Available models: 100+`);
  console.log(`   Fallback chains: Ready`);
  console.log('   Cost savings: Haiku + external models for optimal pricing\n');

  manager.shutdownAll();
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
