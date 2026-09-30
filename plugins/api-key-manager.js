/**
 * API Key Manager Plugin
 * Securely manages and provides API keys for external services
 */

const fs = require('fs');
const path = require('path');

class APIKeyManager {
  constructor(config = {}) {
    this.name = config.name || 'APIKeyManager';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.envFile = config.envFile || path.join(__dirname, '..', '.env');
    this.keys = new Map();
    this.providers = new Map();
    this.loadedFromEnv = false;
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }

    try {
      this.loadKeysFromEnvironment();
      this.initializeProviders();
      console.log(`${this.name} v${this.version} initialized`);
      return true;
    } catch (error) {
      console.log(`${this.name} initialized (no .env file)`);
      return true;
    }
  }

  /**
   * Load keys from environment variables and .env file
   */
  loadKeysFromEnvironment() {
    // Load from environment variables first
    const apiKeys = {
      openrouter: process.env.OPENROUTER_API_KEY,
      together: process.env.TOGETHER_API_KEY,
      replicate: process.env.REPLICATE_API_KEY
    };

    // Try to load from .env file
    if (fs.existsSync(this.envFile)) {
      const envContent = fs.readFileSync(this.envFile, 'utf-8');
      const lines = envContent.split('\n');

      lines.forEach(line => {
        if (line.trim().startsWith('#') || !line.includes('=')) return;

        const [key, value] = line.split('=').map(s => s.trim());

        if (key === 'OPENROUTER_API_KEY') {
          apiKeys.openrouter = value || apiKeys.openrouter;
        } else if (key === 'TOGETHER_API_KEY') {
          apiKeys.together = value || apiKeys.together;
        } else if (key === 'REPLICATE_API_KEY') {
          apiKeys.replicate = value || apiKeys.replicate;
        }
      });
    }

    // Store loaded keys (masked)
    for (const [provider, key] of Object.entries(apiKeys)) {
      if (key && key !== 'your_' + provider.toLowerCase() + '_key_here') {
        this.keys.set(provider, key);
      }
    }

    this.loadedFromEnv = true;
  }

  /**
   * Initialize provider information
   */
  initializeProviders() {
    this.providers.set('openrouter', {
      name: 'OpenRouter',
      baseURL: 'https://openrouter.io/api/v1',
      hasKey: this.keys.has('openrouter'),
      status: this.keys.has('openrouter') ? 'configured' : 'not configured',
      models: [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'claude-3-opus',
        'claude-3-sonnet',
        'llama-2-70b',
        'mistral-7b',
        'mixtral-8x7b'
      ],
      docs: 'https://openrouter.ai/docs',
      getKey: 'https://openrouter.ai/keys'
    });

    this.providers.set('together', {
      name: 'Together AI',
      baseURL: 'https://api.together.xyz/inference',
      hasKey: this.keys.has('together'),
      status: this.keys.has('together') ? 'configured' : 'not configured',
      models: [
        'togethercomputer/llama-2-70b-chat',
        'mistralai/Mistral-7B-Instruct-v0.1',
        'meta-llama/Llama-2-7b-hf',
        'WizardLM/WizardLM-13B-V1.2'
      ],
      docs: 'https://docs.together.ai',
      getKey: 'https://www.together.ai/'
    });

    this.providers.set('replicate', {
      name: 'Replicate',
      baseURL: 'https://api.replicate.com/v1',
      hasKey: this.keys.has('replicate'),
      status: this.keys.has('replicate') ? 'configured' : 'not configured',
      models: [
        'openai/gpt-4-vision',
        'stability-ai/stable-diffusion',
        'openai/whisper',
        'replicate/llama-2-70b'
      ],
      docs: 'https://replicate.com/docs',
      getKey: 'https://replicate.com/account/api-tokens'
    });
  }

  /**
   * Get API key for provider
   */
  getKey(provider) {
    const key = this.keys.get(provider);
    if (!key) {
      return null;
    }
    return key;
  }

  /**
   * Check if provider is configured
   */
  isConfigured(provider) {
    return this.keys.has(provider) && this.keys.get(provider) !== null;
  }

  /**
   * Add API key
   */
  addKey(provider, key) {
    if (!key || key.length < 5) {
      return { status: 'error', message: 'Invalid API key' };
    }

    this.keys.set(provider, key);
    return {
      status: 'success',
      message: `API key added for ${provider}`,
      provider,
      keyLength: key.length,
      masked: key.substring(0, 5) + '...' + key.substring(key.length - 5)
    };
  }

  /**
   * Get provider info
   */
  getProviderInfo(provider) {
    const info = this.providers.get(provider);
    if (!info) {
      return { status: 'error', message: `Provider ${provider} not found` };
    }

    return {
      status: 'success',
      ...info,
      configured: this.isConfigured(provider),
      key: this.isConfigured(provider) ? 'configured' : 'not configured'
    };
  }

  /**
   * List all providers
   */
  listProviders() {
    const providers = [];

    for (const [key, info] of this.providers) {
      providers.push({
        id: key,
        name: info.name,
        status: info.status,
        configured: this.isConfigured(key),
        modelCount: info.models.length,
        docs: info.docs,
        getKey: info.getKey
      });
    }

    return {
      status: 'success',
      providers,
      configuredCount: providers.filter(p => p.configured).length,
      totalCount: providers.length
    };
  }

  /**
   * Get provider setup instructions
   */
  getSetupInstructions(provider) {
    const info = this.providers.get(provider);
    if (!info) {
      return { status: 'error', message: 'Provider not found' };
    }

    return {
      status: 'success',
      provider,
      name: info.name,
      steps: [
        {
          step: 1,
          title: 'Get API Key',
          description: `Visit ${info.getKey}`,
          link: info.getKey
        },
        {
          step: 2,
          title: 'Copy this to .env file',
          description: `Add: ${provider.toUpperCase()}_API_KEY=your_key_here`
        },
        {
          step: 3,
          title: 'Load keys',
          description: `manager.loadKeysFromEnvironment()`
        },
        {
          step: 4,
          title: 'Verify',
          description: `manager.isConfigured('${provider}') should return true`
        }
      ],
      documentation: info.docs
    };
  }

  /**
   * Test API key validity (basic check)
   */
  testKey(provider) {
    const key = this.getKey(provider);
    if (!key) {
      return { status: 'error', message: 'Key not configured' };
    }

    // Basic validation
    const isValid = key.length > 10 && !key.includes('your_');

    return {
      status: 'success',
      provider,
      keyConfigured: true,
      format: isValid ? 'valid format' : 'invalid format',
      length: key.length,
      masked: key.substring(0, 5) + '...' + key.substring(key.length - 5)
    };
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders() {
    const configured = [];

    for (const provider of this.keys.keys()) {
      configured.push({
        provider,
        name: this.providers.get(provider)?.name,
        models: this.providers.get(provider)?.models.length || 0
      });
    }

    return {
      status: 'success',
      configured,
      count: configured.length
    };
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, provider, key } = input;

    switch (action) {
      case 'getKey':
        return { status: 'success', key: this.getKey(provider) ? '***' : null };
      case 'isConfigured':
        return { status: 'success', configured: this.isConfigured(provider) };
      case 'addKey':
        return this.addKey(provider, key);
      case 'getProviderInfo':
        return this.getProviderInfo(provider);
      case 'listProviders':
        return this.listProviders();
      case 'getSetupInstructions':
        return this.getSetupInstructions(provider);
      case 'testKey':
        return this.testKey(provider);
      case 'getConfiguredProviders':
        return this.getConfiguredProviders();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  shutdown() {
    console.log(`${this.name} shutdown`);
    return true;
  }
}

module.exports = APIKeyManager;
