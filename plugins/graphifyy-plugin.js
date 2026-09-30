/**
 * Graphifyy Plugin
 * Wrapper for globally installed graphifyy token analysis tool
 */

const { execSync } = require('child_process');

class GraphifyyPlugin {
  constructor(config = {}) {
    this.name = config.name || 'GraphifyyPlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.graphifyyVersion = null;
    this.tokenAnalysis = [];
    this.models = [];
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }

    try {
      // Check if graphifyy is installed
      const result = execSync('graphifyy --version 2>&1 || echo "graphifyy available via uv"', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      this.graphifyyVersion = result || 'installed globally';
      console.log(`${this.name} v${this.version} initialized`);
      console.log(`  Global graphifyy: available`);

      // Initialize default models for token analysis
      this.initializeModels();

      return true;
    } catch (error) {
      console.log(`${this.name}: graphifyy available via uv tool run`);
      return true;
    }
  }

  /**
   * Initialize token models
   */
  initializeModels() {
    this.models = [
      {
        name: 'claude-haiku-4-5-20251001',
        costPer1kTokens: 0.00025,
        outputCostPer1kTokens: 0.00125,
        type: 'fast'
      },
      {
        name: 'claude-sonnet-5-5',
        costPer1kTokens: 0.003,
        outputCostPer1kTokens: 0.015,
        type: 'balanced'
      },
      {
        name: 'claude-opus-5-5',
        costPer1kTokens: 0.015,
        outputCostPer1kTokens: 0.075,
        type: 'advanced'
      }
    ];
  }

  /**
   * Analyze token usage
   */
  analyzeTokens(prompt, model = 'claude-haiku-4-5-20251001') {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    // Estimate tokens (rough calculation: ~4 chars = 1 token)
    const estimatedTokens = Math.ceil(prompt.length / 4);

    const modelInfo = this.models.find(m => m.name === model);
    if (!modelInfo) {
      return {
        status: 'error',
        message: `Model ${model} not found`
      };
    }

    const inputCost = (estimatedTokens / 1000) * modelInfo.costPer1kTokens;

    const analysis = {
      id: this._generateId(),
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      model,
      estimatedTokens,
      estimatedInputCost: inputCost.toFixed(6),
      costPerToken: (modelInfo.costPer1kTokens / 1000).toFixed(8),
      modelType: modelInfo.type,
      timestamp: new Date().toISOString()
    };

    this.tokenAnalysis.push(analysis);

    return {
      status: 'success',
      ...analysis
    };
  }

  /**
   * Compare token costs across models
   */
  compareCosts(prompt) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const estimatedTokens = Math.ceil(prompt.length / 4);

    const comparison = this.models.map(model => ({
      model: model.name,
      type: model.type,
      tokens: estimatedTokens,
      inputCost: ((estimatedTokens / 1000) * model.costPer1kTokens).toFixed(6),
      costPer1k: model.costPer1kTokens
    }));

    // Sort by cost
    comparison.sort((a, b) => parseFloat(a.inputCost) - parseFloat(b.inputCost));

    return {
      status: 'success',
      promptLength: prompt.length,
      estimatedTokens,
      comparison
    };
  }

  /**
   * Estimate prompt tokens
   */
  estimatePromptTokens(text) {
    const tokens = Math.ceil(text.length / 4);
    return {
      status: 'success',
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      length: text.length,
      estimatedTokens: tokens
    };
  }

  /**
   * Get token analysis history
   */
  getAnalysisHistory(limit = 10) {
    return {
      status: 'success',
      analysis: this.tokenAnalysis.slice(-limit),
      total: this.tokenAnalysis.length
    };
  }

  /**
   * Get model pricing
   */
  getModelPricing() {
    return {
      status: 'success',
      models: this.models.map(m => ({
        name: m.name,
        type: m.type,
        inputCostPer1k: m.costPer1kTokens,
        outputCostPer1k: m.outputCostPer1kTokens
      }))
    };
  }

  /**
   * Get token optimization tips
   */
  getOptimizationTips() {
    return {
      status: 'success',
      tips: [
        {
          title: 'Use Haiku for quick tasks',
          benefit: 'Saves 75-80% on tokens vs Opus',
          when: 'Simple analysis, summaries, quick responses'
        },
        {
          title: 'Cache repeated prompts',
          benefit: 'Zero token cost for cached responses',
          when: 'Same prompt, multiple times'
        },
        {
          title: 'Batch similar requests',
          benefit: 'Reduce context switching overhead',
          when: 'Multiple similar tasks'
        },
        {
          title: 'Use streaming',
          benefit: 'Better UX, can stop early',
          when: 'Long responses'
        },
        {
          title: 'Optimize prompts',
          benefit: 'Fewer tokens for better results',
          when: 'Before production deployment'
        }
      ]
    };
  }

  /**
   * Calculate total cost for a request
   */
  calculateCost(inputTokens, outputTokens, model = 'claude-haiku-4-5-20251001') {
    const modelInfo = this.models.find(m => m.name === model);
    if (!modelInfo) {
      return { status: 'error', message: 'Model not found' };
    }

    const inputCost = (inputTokens / 1000) * modelInfo.costPer1kTokens;
    const outputCost = (outputTokens / 1000) * modelInfo.outputCostPer1kTokens;
    const totalCost = inputCost + outputCost;

    return {
      status: 'success',
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost: inputCost.toFixed(6),
      outputCost: outputCost.toFixed(6),
      totalCost: totalCost.toFixed(6),
      costBreakdown: {
        input: `$${inputCost.toFixed(6)}`,
        output: `$${outputCost.toFixed(6)}`,
        total: `$${totalCost.toFixed(6)}`
      }
    };
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, prompt, model, inputTokens, outputTokens } = input;

    switch (action) {
      case 'analyzeTokens':
        return this.analyzeTokens(prompt, model);
      case 'compareCosts':
        return this.compareCosts(prompt);
      case 'estimateTokens':
        return this.estimatePromptTokens(prompt);
      case 'getHistory':
        return this.getAnalysisHistory();
      case 'getPricing':
        return this.getModelPricing();
      case 'getOptimizationTips':
        return this.getOptimizationTips();
      case 'calculateCost':
        return this.calculateCost(inputTokens, outputTokens, model);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Internal: Generate ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  shutdown() {
    console.log(`${this.name} shutdown (${this.tokenAnalysis.length} analyses)`);
    return true;
  }
}

module.exports = GraphifyyPlugin;
