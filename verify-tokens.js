const { PluginManager, GraphifyyPlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('graphifyy', GraphifyyPlugin);
manager.initializeAll();

const graphifyy = manager.get('graphifyy');

// Example prompt
const prompt = "Write a comprehensive guide on machine learning with examples and code";

console.log("\n=== GRAPHIFYY TOKEN TRACKING ===\n");
console.log("Prompt:", prompt);
console.log("Length:", prompt.length, "characters\n");

// Analyze with each model
console.log("INDIVIDUAL ANALYSIS:");
const haiku = graphifyy.analyzeTokens(prompt, 'claude-haiku-4-5-20251001');
console.log("✅ Haiku:  " + haiku.estimatedTokens + " tokens = $" + haiku.estimatedInputCost);

const sonnet = graphifyy.analyzeTokens(prompt, 'claude-sonnet-5-5');
console.log("✅ Sonnet: " + sonnet.estimatedTokens + " tokens = $" + sonnet.estimatedInputCost);

const opus = graphifyy.analyzeTokens(prompt, 'claude-opus-5-5');
console.log("✅ Opus:   " + opus.estimatedTokens + " tokens = $" + opus.estimatedInputCost);

// Compare costs
console.log("\nCOST COMPARISON (Sorted by cost):");
const comparison = graphifyy.compareCosts(prompt);
comparison.comparison.forEach((c, i) => {
  console.log((i + 1) + ". " + c.model + " ($" + c.inputCost + ")");
});

// Calculate savings
const savings = (parseFloat(opus.estimatedInputCost) - parseFloat(haiku.estimatedInputCost)).toFixed(6);
const savingsPercent = Math.round((parseFloat(savings) / parseFloat(opus.estimatedInputCost)) * 100);

console.log("\n💰 SAVINGS WITH HAIKU:");
console.log("   vs Opus: $" + savings + " (" + savingsPercent + "% cheaper)");

console.log("\n✅ GRAPHIFYY IS RUNNING AND TRACKING TOKENS!\n");
