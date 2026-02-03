/**
 * DATA PROCESSOR
 * Loads and processes CSV data files
 * Builds graph structure and calculates wallet features
 */

class DataProcessor {
    constructor() {
        this.transactions = [];
        this.wallets = new Map();
        this.labels = new Map();
        this.predictions = new Map();
        this.graph = {
            nodes: [],
            edges: []
        };
    }

    /**
     * Load all CSV files and build graph
     */
    async loadData() {
        try {
            // Load transactions
            this.transactions = await this.loadCSV('data/reduced_transactions.csv');
            console.log(`Loaded ${this.transactions.length} transactions`);

            // Load labels
            const labelsData = await this.loadCSV('data/reduced_labels.csv');
            labelsData.forEach(row => {
                this.labels.set(row.Wallet_ID, parseInt(row.Label));
            });
            console.log(`Loaded ${this.labels.size} wallet labels`);

            // Load predictions
            const predictionsData = await this.loadCSV('data/reduced_predictions.csv');
            predictionsData.forEach(row => {
                this.predictions.set(row.Wallet_ID, {
                    gnnProb: parseFloat(row.GNN_Prob),
                    trueLabel: parseInt(row.True_Label),
                    predictedClass: parseInt(row.Predicted_Class)
                });
            });
            console.log(`Loaded ${this.predictions.size} wallet predictions`);

            // Build graph structure
            this.buildGraph();
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    /**
     * Load CSV file using PapaParse
     */
    loadCSV(filepath) {
        return new Promise((resolve, reject) => {
            Papa.parse(filepath, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    resolve(results.data);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }

    /**
     * Build graph structure from transactions
     */
    buildGraph() {
        const walletSet = new Set();

        // Collect all unique wallets and build adjacency lists
        this.transactions.forEach(tx => {
            if (!tx.Source || !tx.Target) return;

            walletSet.add(tx.Source);
            walletSet.add(tx.Target);

            // Initialize wallet data
            if (!this.wallets.has(tx.Source)) {
                this.wallets.set(tx.Source, this.initWallet(tx.Source));
            }
            if (!this.wallets.has(tx.Target)) {
                this.wallets.set(tx.Target, this.initWallet(tx.Target));
            }

            // Add transaction to wallet's transaction lists
            const sourceWallet = this.wallets.get(tx.Source);
            const targetWallet = this.wallets.get(tx.Target);

            sourceWallet.outgoingTxs.push(tx);
            targetWallet.incomingTxs.push(tx);
            sourceWallet.neighbors.add(tx.Target);
            targetWallet.neighbors.add(tx.Source);
        });

        // Calculate features for each wallet
        this.wallets.forEach((wallet, address) => {
            this.calculateWalletFeatures(wallet);
        });

        // Build nodes and edges arrays
        this.buildNodesAndEdges();

        console.log(`Built graph with ${this.graph.nodes.length} nodes and ${this.graph.edges.length} edges`);
    }

    /**
     * Initialize wallet object
     */
    initWallet(address) {
        return {
            id: address,
            label: this.labels.get(address) || 0,
            prediction: this.predictions.get(address) || { gnnProb: 0, trueLabel: 0, predictedClass: 0 },
            incomingTxs: [],
            outgoingTxs: [],
            neighbors: new Set(),
            features: {},
            suspicionScore: 0,
            riskLevel: 'low',
            role: 'standard'
        };
    }

    /**
     * Calculate features for a wallet
     */
    calculateWalletFeatures(wallet) {
        const features = {};

        // Basic degree features
        features.in_degree = wallet.incomingTxs.length;
        features.out_degree = wallet.outgoingTxs.length;
        features.total_degree = features.in_degree + features.out_degree;

        // Transaction amounts
        const allTxs = [...wallet.incomingTxs, ...wallet.outgoingTxs];
        const amounts = allTxs.map(tx => parseFloat(tx.Amount));
        features.avg_tx_amount = amounts.length > 0 ? 
            amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
        features.total_volume = amounts.reduce((a, b) => a + b, 0);

        // Transaction frequency (txs per day)
        if (allTxs.length > 0) {
            const timestamps = allTxs.map(tx => new Date(tx.Timestamp));
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            const days = (maxTime - minTime) / (1000 * 60 * 60 * 24) || 1;
            features.tx_frequency = allTxs.length / days;
        } else {
            features.tx_frequency = 0;
        }

        // Fan-out and fan-in counts
        const uniqueTargets = new Set(wallet.outgoingTxs.map(tx => tx.Target));
        const uniqueSources = new Set(wallet.incomingTxs.map(tx => tx.Source));
        features.fan_out_count = uniqueTargets.size;
        features.fan_in_count = uniqueSources.size;

        // Peeling chain detection (gradual amount decay)
        features.peeling_participation_count = this.detectPeelingChain(wallet);

        // Repeated small transactions
        const smallTxThreshold = 10; // Small transaction threshold
        features.repeated_small_tx_count = wallet.outgoingTxs.filter(tx => 
            parseFloat(tx.Amount) < smallTxThreshold
        ).length;

        // Token distribution (entropy-like measure)
        features.token_diversity = this.calculateTokenDiversity(allTxs);

        wallet.features = features;

        // Calculate suspicion score
        wallet.suspicionScore = this.calculateSuspicionScore(wallet);
        wallet.riskLevel = this.getRiskLevel(wallet.suspicionScore);
        wallet.role = this.determineWalletRole(wallet);
    }

    /**
     * Detect peeling chain participation
     */
    detectPeelingChain(wallet) {
        let peelingCount = 0;
        const sortedTxs = wallet.outgoingTxs.sort((a, b) => 
            new Date(a.Timestamp) - new Date(b.Timestamp)
        );

        for (let i = 1; i < sortedTxs.length; i++) {
            const prevAmount = parseFloat(sortedTxs[i-1].Amount);
            const currAmount = parseFloat(sortedTxs[i].Amount);
            
            // Check for gradual decay (5-20% reduction)
            const decay = (prevAmount - currAmount) / prevAmount;
            if (decay > 0.05 && decay < 0.20) {
                peelingCount++;
            }
        }
        
        return peelingCount;
    }

    /**
     * Calculate token diversity (entropy)
     */
    calculateTokenDiversity(transactions) {
        const tokenCounts = {};
        transactions.forEach(tx => {
            tokenCounts[tx.Token_Type] = (tokenCounts[tx.Token_Type] || 0) + 1;
        });

        const total = transactions.length;
        if (total === 0) return 0;

        let entropy = 0;
        Object.values(tokenCounts).forEach(count => {
            const p = count / total;
            entropy -= p * Math.log2(p);
        });

        return entropy;
    }

    /**
     * Calculate suspicion score (0-1)
     */
    calculateSuspicionScore(wallet) {
        // Use GNN probability as base score
        let score = wallet.prediction.gnnProb;

        // Adjust based on features
        const f = wallet.features;

        // High fan-out is suspicious
        if (f.fan_out_count > 10) score += 0.1;
        
        // High fan-in is suspicious
        if (f.fan_in_count > 10) score += 0.1;
        
        // Peeling chains are suspicious
        if (f.peeling_participation_count > 3) score += 0.15;
        
        // Many small transactions are suspicious
        if (f.repeated_small_tx_count > 5) score += 0.1;
        
        // High transaction frequency is suspicious
        if (f.tx_frequency > 5) score += 0.1;

        // Clamp to [0, 1]
        return Math.min(Math.max(score, 0), 1);
    }

    /**
     * Get risk level from suspicion score
     */
    getRiskLevel(score) {
        if (score < 0.34) return 'low';
        if (score < 0.67) return 'medium';
        return 'high';
    }

    /**
     * Determine wallet role based on topology
     */
    determineWalletRole(wallet) {
        const f = wallet.features;
        
        // Source: High out-degree, low in-degree
        if (f.out_degree > f.in_degree * 2 && f.out_degree > 5) {
            return 'source';
        }
        
        // Aggregator: High in-degree, low out-degree
        if (f.in_degree > f.out_degree * 2 && f.in_degree > 5) {
            return 'aggregator';
        }
        
        // Mule: Balanced in/out, high total degree
        if (Math.abs(f.in_degree - f.out_degree) < 3 && f.total_degree > 8) {
            return 'mule';
        }
        
        return 'standard';
    }

    /**
     * Build nodes and edges arrays for graph visualization
     */
    buildNodesAndEdges() {
        // Build nodes
        this.graph.nodes = Array.from(this.wallets.values()).map(wallet => ({
            id: wallet.id,
            label: wallet.id.substring(0, 8) + '...',
            fullAddress: wallet.id,
            suspicionScore: wallet.suspicionScore,
            riskLevel: wallet.riskLevel,
            role: wallet.role,
            features: wallet.features,
            trueLabel: wallet.label,
            prediction: wallet.prediction,
            inDegree: wallet.features.in_degree,
            outDegree: wallet.features.out_degree,
            totalVolume: wallet.features.total_volume
        }));

        // Build edges
        this.graph.edges = this.transactions.map(tx => ({
            source: tx.Source,
            target: tx.Target,
            amount: parseFloat(tx.Amount),
            timestamp: new Date(tx.Timestamp),
            token: tx.Token_Type,
            // Calculate recency (0-1, where 1 is most recent)
            recency: 0
        }));

        // Calculate edge recency
        const timestamps = this.graph.edges.map(e => e.timestamp.getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRange = maxTime - minTime || 1;

        this.graph.edges.forEach(edge => {
            edge.recency = (edge.timestamp.getTime() - minTime) / timeRange;
        });
    }

    /**
     * Get top N wallets by suspicion score
     */
    getTopSuspiciousWallets(n = 50) {
        return Array.from(this.wallets.values())
            .sort((a, b) => b.suspicionScore - a.suspicionScore)
            .slice(0, n);
    }

    /**
     * Get wallet by address
     */
    getWallet(address) {
        return this.wallets.get(address);
    }

    /**
     * Search wallets by partial address
     */
    searchWallets(query) {
        query = query.toLowerCase();
        return Array.from(this.wallets.values())
            .filter(w => w.id.toLowerCase().includes(query))
            .slice(0, 10);
    }

    /**
     * Get graph data
     */
    getGraph() {
        return this.graph;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const walletArray = Array.from(this.wallets.values());
        return {
            totalWallets: walletArray.length,
            totalTransactions: this.transactions.length,
            highRiskWallets: walletArray.filter(w => w.riskLevel === 'high').length,
            mediumRiskWallets: walletArray.filter(w => w.riskLevel === 'medium').length,
            lowRiskWallets: walletArray.filter(w => w.riskLevel === 'low').length,
            avgSuspicionScore: walletArray.reduce((sum, w) => sum + w.suspicionScore, 0) / walletArray.length
        };
    }
}

// Export for use in other modules
window.DataProcessor = DataProcessor;
