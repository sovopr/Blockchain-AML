/**
 * PATTERN DETECTOR
 * Detects money laundering patterns in the transaction graph
 */

class PatternDetector {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
        this.patterns = {
            fanOut: [],
            fanIn: [],
            peelingChains: [],
            fixedDelay: [],
            seedExpansion: []
        };
        this.thresholds = {
            fanOut: 10,
            fanIn: 10,
            peelingChainLength: 3,
            fixedDelayTolerance: 5, // seconds
            smallTxThreshold: 10
        };
    }

    /**
     * Detect all patterns
     */
    detectAllPatterns() {
        console.log('Detecting patterns...');
        this.detectFanOutPattern();
        this.detectFanInPattern();
        this.detectPeelingChains();
        this.detectFixedDelayCoordination();
        this.detectSeedExpansion();
        return this.patterns;
    }

    /**
     * Detect Fan-Out pattern (1 → many)
     */
    detectFanOutPattern() {
        const wallets = Array.from(this.dataProcessor.wallets.values());

        this.patterns.fanOut = wallets
            .filter(w => w.features.fan_out_count >= this.thresholds.fanOut)
            .map(w => ({
                walletId: w.id,
                fanOutCount: w.features.fan_out_count,
                avgAmount: w.features.avg_tx_amount,
                suspicionScore: w.suspicionScore,
                reason: `Sent funds to ${w.features.fan_out_count} different destinations`,
                triggered: ['fan_out_count']
            }))
            .sort((a, b) => b.fanOutCount - a.fanOutCount);

        console.log(`Detected ${this.patterns.fanOut.length} fan-out patterns`);
    }

    /**
     * Detect Fan-In pattern (many → 1)
     */
    detectFanInPattern() {
        const wallets = Array.from(this.dataProcessor.wallets.values());

        this.patterns.fanIn = wallets
            .filter(w => w.features.fan_in_count >= this.thresholds.fanIn)
            .map(w => ({
                walletId: w.id,
                fanInCount: w.features.fan_in_count,
                avgAmount: w.features.avg_tx_amount,
                suspicionScore: w.suspicionScore,
                reason: `Received funds from ${w.features.fan_in_count} different sources`,
                triggered: ['fan_in_count']
            }))
            .sort((a, b) => b.fanInCount - a.fanInCount);

        console.log(`Detected ${this.patterns.fanIn.length} fan-in patterns`);
    }

    /**
     * Detect Peeling Chains (gradual amount decay through hops)
     */
    detectPeelingChains() {
        const wallets = Array.from(this.dataProcessor.wallets.values());

        this.patterns.peelingChains = wallets
            .filter(w => w.features.peeling_participation_count >= this.thresholds.peelingChainLength)
            .map(w => {
                const decayRate = this.calculatePeelingDecayRate(w);
                return {
                    walletId: w.id,
                    chainLength: w.features.peeling_participation_count,
                    avgDecayRate: decayRate,
                    suspicionScore: w.suspicionScore,
                    reason: `Participated in ${w.features.peeling_participation_count} peeling transactions`,
                    triggered: ['peeling_participation_count']
                };
            })
            .sort((a, b) => b.chainLength - a.chainLength);

        console.log(`Detected ${this.patterns.peelingChains.length} peeling chains`);
    }

    /**
     * Calculate peeling decay rate
     */
    calculatePeelingDecayRate(wallet) {
        const sortedTxs = wallet.outgoingTxs.sort((a, b) =>
            new Date(a.Timestamp) - new Date(b.Timestamp)
        );

        const decayRates = [];
        for (let i = 1; i < sortedTxs.length; i++) {
            const prevAmount = parseFloat(sortedTxs[i - 1].Amount);
            const currAmount = parseFloat(sortedTxs[i].Amount);
            if (prevAmount > 0) {
                const decay = (prevAmount - currAmount) / prevAmount;
                if (decay > 0) decayRates.push(decay);
            }
        }

        return decayRates.length > 0
            ? decayRates.reduce((a, b) => a + b, 0) / decayRates.length
            : 0;
    }

    /**
     * Detect Fixed-Delay Coordination (periodic transactions)
     */
    detectFixedDelayCoordination() {
        const wallets = Array.from(this.dataProcessor.wallets.values());
        const coordinated = [];

        wallets.forEach(wallet => {
            const txs = wallet.outgoingTxs.sort((a, b) =>
                new Date(a.Timestamp) - new Date(b.Timestamp)
            );

            if (txs.length < 3) return;

            // Calculate inter-transaction delays
            const delays = [];
            for (let i = 1; i < txs.length; i++) {
                const delay = (new Date(txs[i].Timestamp) - new Date(txs[i - 1].Timestamp)) / 1000;
                delays.push(delay);
            }

            // Check for consistent delays
            const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
            const variance = delays.reduce((sum, d) => sum + Math.pow(d - avgDelay, 2), 0) / delays.length;
            const stdDev = Math.sqrt(variance);

            // Low variance indicates fixed delay
            if (stdDev < this.thresholds.fixedDelayTolerance && avgDelay > 0) {
                coordinated.push({
                    walletId: wallet.id,
                    avgDelay: Math.round(avgDelay),
                    variance: Math.round(stdDev * 100) / 100,
                    transactionCount: txs.length,
                    suspicionScore: wallet.suspicionScore,
                    reason: `Transactions occur with periodic ${Math.round(avgDelay)}s intervals`,
                    triggered: ['fixed_delay']
                });
            }
        });

        this.patterns.fixedDelay = coordinated.sort((a, b) => b.transactionCount - a.transactionCount);
        console.log(`Detected ${this.patterns.fixedDelay.length} fixed-delay coordinations`);
    }

    /**
     * Detect Seed Expansion (illicit wallet tree growth)
     */
    detectSeedExpansion() {
        // Find wallets with true label = 1 (illicit)
        const illicitSeeds = Array.from(this.dataProcessor.wallets.values())
            .filter(w => w.label === 1);

        const expansionTrees = [];

        illicitSeeds.forEach(seed => {
            const tree = this.buildExpansionTree(seed.id, 3); // 3 hops max

            if (tree.wallets.size > 5) {
                expansionTrees.push({
                    seedWallet: seed.id,
                    expandedWallets: Array.from(tree.wallets),
                    depth: tree.depth,
                    spread: tree.wallets.size,
                    suspicionScore: seed.suspicionScore,
                    reason: `Illicit seed expanded to ${tree.wallets.size} wallets`,
                    triggered: ['seed_expansion']
                });
            }
        });

        this.patterns.seedExpansion = expansionTrees.sort((a, b) => b.spread - a.spread);
        console.log(`Detected ${this.patterns.seedExpansion.length} seed expansions`);
    }

    /**
     * Build expansion tree from a seed wallet
     */
    buildExpansionTree(seedId, maxDepth) {
        const visited = new Set([seedId]);
        const graph = this.dataProcessor.getGraph();
        let currentLevel = new Set([seedId]);
        let depth = 0;

        while (depth < maxDepth && currentLevel.size > 0) {
            const nextLevel = new Set();

            graph.edges.forEach(edge => {
                if (currentLevel.has(edge.source) && !visited.has(edge.target)) {
                    visited.add(edge.target);
                    nextLevel.add(edge.target);
                }
            });

            currentLevel = nextLevel;
            depth++;
        }

        return {
            wallets: visited,
            depth
        };
    }

    /**
     * Generate explanation for why a wallet was flagged
     */
    explainWallet(walletId) {
        const wallet = this.dataProcessor.getWallet(walletId);
        if (!wallet) return null;

        const explanations = [];
        const f = wallet.features;

        // Fan-out
        if (f.fan_out_count >= this.thresholds.fanOut) {
            explanations.push({
                parameter: 'fan_out_count',
                value: f.fan_out_count,
                threshold: this.thresholds.fanOut,
                severity: 'high',
                description: `This wallet sent funds to ${f.fan_out_count} different destinations, which exceeds the threshold of ${this.thresholds.fanOut}. This pattern is commonly associated with smurfing.`
            });
        }

        // Fan-in
        if (f.fan_in_count >= this.thresholds.fanIn) {
            explanations.push({
                parameter: 'fan_in_count',
                value: f.fan_in_count,
                threshold: this.thresholds.fanIn,
                severity: 'high',
                description: `This wallet received funds from ${f.fan_in_count} different sources, indicating potential aggregation of illicit funds.`
            });
        }

        // Peeling
        if (f.peeling_participation_count >= this.thresholds.peelingChainLength) {
            explanations.push({
                parameter: 'peeling_participation_count',
                value: f.peeling_participation_count,
                threshold: this.thresholds.peelingChainLength,
                severity: 'medium',
                description: `Participated in ${f.peeling_participation_count} transactions with gradual amount decay, suggesting peeling chain obfuscation.`
            });
        }

        // Small transactions
        if (f.repeated_small_tx_count > 5) {
            explanations.push({
                parameter: 'repeated_small_tx_count',
                value: f.repeated_small_tx_count,
                threshold: 5,
                severity: 'medium',
                description: `Made ${f.repeated_small_tx_count} small transactions (< $${this.thresholds.smallTxThreshold}), typical of smurfing to avoid detection.`
            });
        }

        // High frequency
        if (f.tx_frequency > 5) {
            explanations.push({
                parameter: 'tx_frequency',
                value: Math.round(f.tx_frequency * 10) / 10,
                threshold: 5,
                severity: 'low',
                description: `Transaction frequency of ${Math.round(f.tx_frequency * 10) / 10} transactions per day is unusually high.`
            });
        }

        return {
            walletId,
            suspicionScore: wallet.suspicionScore,
            riskLevel: wallet.riskLevel,
            explanations,
            summary: this.generateSummary(wallet, explanations)
        };
    }

    /**
     * Generate plain-language summary
     */
    generateSummary(wallet, explanations) {
        if (explanations.length === 0) {
            return `This wallet shows ${wallet.riskLevel} suspicion with a score of ${Math.round(wallet.suspicionScore * 100)}%.`;
        }

        const primaryReason = explanations[0];
        const additionalCount = explanations.length - 1;

        let summary = `This wallet shows ${wallet.riskLevel} suspicion (score: ${Math.round(wallet.suspicionScore * 100)}%). `;
        summary += primaryReason.description;

        if (additionalCount > 0) {
            summary += ` Additionally, ${additionalCount} other suspicious pattern${additionalCount > 1 ? 's were' : ' was'} detected.`;
        }

        return summary;
    }

    /**
     * Get all detected patterns
     */
    getAllPatterns() {
        return this.patterns;
    }

    /**
     * Get patterns for a specific wallet
     */
    getWalletPatterns(walletId) {
        const patterns = [];

        Object.entries(this.patterns).forEach(([type, detections]) => {
            detections.forEach(detection => {
                if (detection.walletId === walletId ||
                    (detection.expandedWallets && detection.expandedWallets.includes(walletId))) {
                    patterns.push({ type, ...detection });
                }
            });
        });

        return patterns;
    }
}

// Export
window.PatternDetector = PatternDetector;
