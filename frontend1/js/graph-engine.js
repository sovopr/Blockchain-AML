/**
 * GRAPH ENGINE
 * Handles multi-level graph processing and transformations
 * Levels: 1=Global, 2=Community, 3=Wallet Ego, 4=Transaction Ledger
 */

class GraphEngine {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
        this.currentLevel = 1;
        this.currentCommunity = null;
        this.currentWallet = null;
        this.communities = [];
        this.filters = {
            timeWindow: 90, // days
            tokenTypes: ['ETH', 'USDT'],
            minAmount: 0
        };
    }

    /**
     * LEVEL 1: Generate global overview with communities
     */
    generateGlobalView() {
        const graph = this.dataProcessor.getGraph();

        // Perform community detection (simplified Louvain)
        this.communities = this.detectCommunities(graph);

        // Create community bubbles
        const communityNodes = this.communities.map((community, idx) => {
            const wallets = community.nodes;
            const avgSuspicion = wallets.reduce((sum, w) => sum + w.suspicionScore, 0) / wallets.length;
            const totalVolume = wallets.reduce((sum, w) => sum + w.totalVolume, 0);

            // Determine dominant pattern
            const patterns = this.analyzeCommunityPatterns(wallets);

            return {
                id: `community-${idx}`,
                type: 'community',
                walletCount: wallets.length,
                avgSuspicion,
                riskLevel: this.dataProcessor.getRiskLevel(avgSuspicion),
                totalVolume,
                dominantPattern: patterns[0] || 'Mixed behavior',
                nodes: wallets,
                x: Math.random() * 800 + 100,
                y: Math.random() * 400 + 100
            };
        });

        return {
            level: 1,
            nodes: communityNodes,
            edges: []
        };
    }

    /**
     * Simplified community detection using modularity
     */
    detectCommunities(graph) {
        const nodes = graph.nodes;
        const edges = graph.edges;

        // Build adjacency map
        const adjacency = new Map();
        nodes.forEach(node => {
            adjacency.set(node.id, new Set());
        });

        edges.forEach(edge => {
            if (adjacency.has(edge.source) && adjacency.has(edge.target)) {
                adjacency.get(edge.source).add(edge.target);
                adjacency.get(edge.target).add(edge.source);
            }
        });

        // Initialize each node in its own community
        const communities = new Map();
        nodes.forEach((node, idx) => {
            communities.set(node.id, idx);
        });

        // Greedy modularity optimization (simplified)
        let improved = true;
        let iterations = 0;
        const maxIterations = 10;

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            nodes.forEach(node => {
                const currentCommunity = communities.get(node.id);
                const neighbors = adjacency.get(node.id);

                // Count neighbor communities
                const communityCounts = new Map();
                neighbors.forEach(neighbor => {
                    const neighborCommunity = communities.get(neighbor);
                    communityCounts.set(neighborCommunity, (communityCounts.get(neighborCommunity) || 0) + 1);
                });

                // Find best community
                let bestCommunity = currentCommunity;
                let bestCount = communityCounts.get(currentCommunity) || 0;

                communityCounts.forEach((count, community) => {
                    if (count > bestCount) {
                        bestCount = count;
                        bestCommunity = community;
                    }
                });

                if (bestCommunity !== currentCommunity) {
                    communities.set(node.id, bestCommunity);
                    improved = true;
                }
            });
        }

        // Group nodes by community
        const communityGroups = new Map();
        nodes.forEach(node => {
            const communityId = communities.get(node.id);
            if (!communityGroups.has(communityId)) {
                communityGroups.set(communityId, []);
            }
            communityGroups.get(communityId).push(node);
        });

        // Convert to array and filter small communities
        const result = Array.from(communityGroups.values())
            .filter(nodes => nodes.length >= 5) // Minimum community size
            .map(nodes => ({ nodes, id: nodes[0].id }));

        console.log(`Detected ${result.length} communities`);
        return result;
    }

    /**
     * Analyze dominant patterns in a community
     */
    analyzeCommunityPatterns(wallets) {
        const patterns = {
            'fan-out heavy': 0,
            'fan-in heavy': 0,
            'peeling chains': 0,
            'balanced mixing': 0
        };

        wallets.forEach(wallet => {
            if (wallet.features.fan_out_count > 8) patterns['fan-out heavy']++;
            if (wallet.features.fan_in_count > 8) patterns['fan-in heavy']++;
            if (wallet.features.peeling_participation_count > 2) patterns['peeling chains']++;
            if (Math.abs(wallet.features.in_degree - wallet.features.out_degree) < 3) patterns['balanced mixing']++;
        });

        return Object.entries(patterns)
            .sort((a, b) => b[1] - a[1])
            .map(([pattern]) => pattern);
    }

    /**
     * LEVEL 2: Community drilldown
     */
    generateCommunityView(communityId) {
        const community = this.communities.find(c => c.id === communityId || c.nodes[0].id === communityId);
        if (!community) return null;

        this.currentCommunity = community;
        let nodes = [...community.nodes];

        // Apply filters
        nodes = this.applyFilters(nodes);

        // Limit to 20-100 wallets (show top suspicious)
        if (nodes.length > 100) {
            nodes = nodes.sort((a, b) => b.suspicionScore - a.suspicionScore).slice(0, 100);
        }

        // Get edges between these nodes
        const nodeIds = new Set(nodes.map(n => n.id));
        const edges = this.dataProcessor.getGraph().edges.filter(edge =>
            nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );

        // Filter to high-flow and recent edges only
        const filteredEdges = edges
            .filter(edge => edge.amount > this.filters.minAmount)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 200); // Limit edges to prevent clutter

        return {
            level: 2,
            communityId,
            nodes,
            edges: filteredEdges
        };
    }

    /**
     * Generate full network view (Level 2)
     */
    generateNetworkView() {
        // Get all nodes from top communities + some outliers
        // Limit to avoid browser lag
        let nodes = [];
        this.communities.forEach(c => {
            nodes.push(...c.nodes); // Add all nodes from detected communities
        });

        // If we have too many, limit by suspicion or volume
        if (nodes.length > 300) {
            nodes = nodes.sort((a, b) => b.suspicionScore - a.suspicionScore).slice(0, 300);
        }

        // Include edges
        const nodeIds = new Set(nodes.map(n => n.id));
        const edges = this.dataProcessor.getGraph().edges.filter(edge =>
            nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );

        // Filter edges strictly to show structure
        const filteredEdges = edges
            .filter(edge => edge.amount > this.filters.minAmount)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 500);

        return {
            level: 2,
            nodes,
            edges: filteredEdges
        };
    }

    /**
     * LEVEL 3: Wallet-centric ego graph
     */
    generateEgoGraph(walletId, hops = 2) {
        this.currentWallet = walletId;
        const graph = this.dataProcessor.getGraph();

        // Get ego network (n-hop neighbors)
        const egoNodes = new Set([walletId]);
        const egoEdges = [];

        let currentLevel = new Set([walletId]);

        for (let hop = 0; hop < hops; hop++) {
            const nextLevel = new Set();

            graph.edges.forEach(edge => {
                // Handle D3 mutation where source/target become objects
                const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
                const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;

                if (currentLevel.has(sourceId)) {
                    nextLevel.add(targetId);
                    egoNodes.add(targetId);
                    egoEdges.push(edge);
                }
                if (currentLevel.has(targetId)) {
                    nextLevel.add(sourceId);
                    egoNodes.add(sourceId);
                    egoEdges.push(edge);
                }
            });

            currentLevel = nextLevel;
        }

        // Get node objects
        const nodes = graph.nodes.filter(n => egoNodes.has(n.id));

        // Categorize nodes by direction
        const centerNode = nodes.find(n => n.id === walletId);
        const incomingNodes = [];
        const outgoingNodes = [];
        const intermediateNodes = [];

        nodes.forEach(node => {
            if (node.id === walletId) return;

            const hasIncoming = egoEdges.some(e => {
                const s = typeof e.source === 'object' ? e.source.id : e.source;
                const t = typeof e.target === 'object' ? e.target.id : e.target;
                return s === node.id && t === walletId;
            });
            const hasOutgoing = egoEdges.some(e => {
                const s = typeof e.source === 'object' ? e.source.id : e.source;
                const t = typeof e.target === 'object' ? e.target.id : e.target;
                return s === walletId && t === node.id;
            });

            if (hasIncoming) incomingNodes.push(node);
            else if (hasOutgoing) outgoingNodes.push(node);
            else intermediateNodes.push(node);
        });

        return {
            level: 3,
            walletId,
            centerNode,
            incomingNodes,
            outgoingNodes,
            intermediateNodes,
            nodes,
            edges: egoEdges
        };
    }

    /**
     * LEVEL 4: Transaction ledger
     */
    generateTransactionLedger(walletId) {
        const wallet = this.dataProcessor.getWallet(walletId);
        if (!wallet) return null;

        const allTransactions = [
            ...wallet.incomingTxs.map(tx => ({ ...tx, direction: 'incoming' })),
            ...wallet.outgoingTxs.map(tx => ({ ...tx, direction: 'outgoing' }))
        ].sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

        return {
            level: 4,
            walletId,
            wallet,
            transactions: allTransactions,
            totalIncoming: wallet.incomingTxs.length,
            totalOutgoing: wallet.outgoingTxs.length,
            totalVolume: wallet.features.total_volume
        };
    }

    /**
     * Apply current filters to nodes
     */
    applyFilters(nodes) {
        const graph = this.dataProcessor.getGraph();
        const now = new Date();
        const cutoffDate = new Date(now - this.filters.timeWindow * 24 * 60 * 60 * 1000);

        return nodes.filter(node => {
            const wallet = this.dataProcessor.getWallet(node.id);
            if (!wallet) return true;

            // Time window filter
            const recentTxs = [...wallet.incomingTxs, ...wallet.outgoingTxs]
                .filter(tx => new Date(tx.Timestamp) >= cutoffDate);

            if (recentTxs.length === 0 && this.filters.timeWindow < 90) return false;

            // Token type filter
            const hasRelevantToken = recentTxs.some(tx =>
                this.filters.tokenTypes.includes(tx.Token_Type)
            );

            if (!hasRelevantToken && recentTxs.length > 0) return false;

            return true;
        });
    }

    /**
     * Update filter settings
     */
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
    }

    /**
     * Get current filters
     */
    getFilters() {
        return this.filters;
    }

    /**
     * Export graph data
     */
    exportData(format = 'json') {
        const data = {
            currentLevel: this.currentLevel,
            graph: this.dataProcessor.getGraph(),
            communities: this.communities,
            filters: this.filters
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            // Export nodes as CSV
            const nodes = this.dataProcessor.getGraph().nodes;
            let csv = 'Address,Suspicion Score,Risk Level,Role,In Degree,Out Degree,Total Volume\n';
            nodes.forEach(node => {
                csv += `${node.id},${node.suspicionScore},${node.riskLevel},${node.role},${node.inDegree},${node.outDegree},${node.totalVolume}\n`;
            });
            return csv;
        }
    }
}

// Export
window.GraphEngine = GraphEngine;
