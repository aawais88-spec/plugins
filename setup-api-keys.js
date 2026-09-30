#!/usr/bin/env node

/**
 * API Key Setup Wizard
 * Interactive guide to set up API keys for external AI models
 */

const fs = require('fs');
const path = require('path');
const { PluginManager, APIKeyManager } = require('./plugins');

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   External AI Model API Key Setup Wizard                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize
  const manager = new PluginManager();
  manager.register('keyManager', APIKeyManager);
  manager.initializeAll();

  const keyManager = manager.get('keyManager');

  // Show available providers
  console.log('📚 AVAILABLE PROVIDERS:\n');
  const providers = keyManager.listProviders();

  providers.providers.forEach((p, i) => {
    const status = p.configured ? '✅' : '❌';
    console.log(`${i + 1}. ${status} ${p.name}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   Models: ${p.modelCount}`);
    console.log(`   Get key: ${p.getKey}`);
    console.log(`   Docs: ${p.docs}\n`);
  });

  // Show setup instructions
  console.log('\n📋 SETUP INSTRUCTIONS:\n');

  const providers_to_setup = ['openrouter', 'together', 'replicate'];

  providers_to_setup.forEach(provider => {
    const info = keyManager.getProviderInfo(provider);
    console.log(`\n${info.name.toUpperCase()}`);
    console.log('='.repeat(50));

    const setup = keyManager.getSetupInstructions(provider);
    setup.steps.forEach(step => {
      console.log(`\nStep ${step.step}: ${step.title}`);
      console.log(`${step.description}`);
      if (step.link) console.log(`Link: ${step.link}`);
    });
  });

  // Quick setup guide
  console.log('\n\n🚀 QUICK SETUP (3 STEPS):\n');
  console.log('Step 1: Get API Keys');
  console.log('  • OpenRouter: https://openrouter.ai/keys');
  console.log('  • Together AI: https://www.together.ai/');
  console.log('  • Replicate: https://replicate.com/account/api-tokens\n');

  console.log('Step 2: Copy and edit .env file');
  console.log('  cp .env.example .env');
  console.log('  # Then edit .env and add your actual API keys\n');

  console.log('Step 3: Use in your code');
  console.log('  const keyManager = manager.get(\'keyManager\');');
  console.log('  if (keyManager.isConfigured(\'openrouter\')) {');
  console.log('    // Use OpenRouter API');
  console.log('  }\n');

  // Show current status
  console.log('\n📊 CURRENT STATUS:\n');
  const configured = keyManager.getConfiguredProviders();
  console.log(`Configured providers: ${configured.count}`);

  if (configured.count === 0) {
    console.log('\n⚠️  No API keys configured yet. Follow the steps above to get started.\n');
  } else {
    console.log('\nConfigured:');
    configured.configured.forEach(p => {
      console.log(`  ✅ ${p.name} (${p.models} models available)`);
    });
    console.log();
  }

  // Test configured keys
  console.log('\n🧪 TESTING CONFIGURED KEYS:\n');

  for (const provider of ['openrouter', 'together', 'replicate']) {
    const info = keyManager.getProviderInfo(provider);
    const test = keyManager.testKey(provider);

    if (test.status === 'success' && test.keyConfigured) {
      console.log(`✅ ${info.name}: ${test.masked}`);
    } else {
      console.log(`❌ ${info.name}: Not configured`);
    }
  }

  console.log('\n\n💡 NEXT STEPS:\n');
  console.log('1. Get your API keys from the links above');
  console.log('2. Copy .env.example to .env');
  console.log('3. Add your API keys to .env');
  console.log('4. Run: node setup-api-keys.js (again to verify)');
  console.log('5. Use external models with: node demo-external-access.js\n');

  console.log('📖 Full guide available in: INTEGRATION_GUIDE.md\n');

  manager.shutdownAll();
}

main().catch(error => {
  console.error('Setup wizard error:', error.message);
  process.exit(1);
});
