/**
 * GRAPH RENDERER - REFINED VERSION
 * Updated colors to use soft pastels
 */

class GraphRenderer {
    constructor(container) {
        this.container = d3.select(container);
        this.svg = null;
        this.g = null;
        this.simulation = null;
        this.currentLevel = 1;

        // Crypto.com Theme Colors
        this.colors = {
            low: '#16C784',      // Success green
            medium: '#FFA726',   // Warning orange
            high: '#EA3943'      // Danger red
        };

        this.width = 0;
        this.height = 0;
        this.zoom = null;

        this.init();
    }

    /**
     * Initialize SVG and zoom
     */
    init() {
        const containerNode = this.container.node();
        this.width = containerNode.clientWidth;
        this.height = containerNode.clientHeight;

        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', [0, 0, this.width, this.height]);

        // Create main group for zoom/pan
        this.g = this.svg.append('g');

        // Setup zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
    }

    /**
     * Render Level 1: Global Overview (Communities)
     */
    renderLevel1(data, onCommunityClick) {
        this.clear();
        this.currentLevel = 1;

        const nodes = data.nodes;

        // Create force simulation
        this.simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => this.getCommunityRadius(d) + 20));

        // Draw community bubbles
        const bubbles = this.g.selectAll('.community')
            .data(nodes)
            .join('circle')
            .attr('class', 'community node')
            .attr('r', d => this.getCommunityRadius(d))
            .attr('fill', d => this.colors[d.riskLevel])
            .attr('fill-opacity', 0.65)
            .attr('stroke', d => this.colors[d.riskLevel])
            .attr('stroke-width', 2)
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                if (onCommunityClick) onCommunityClick(d);
            })
            .on('mouseover', (event, d) => this.showCommunityTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .call(this.drag(this.simulation));

        // Add labels
        const labels = this.g.selectAll('.community-label')
            .data(nodes)
            .join('text')
            .attr('class', 'community-label node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('fill', '#4a5568')
            .style('pointer-events', 'none')
            .text(d => `${d.walletCount} wallets`);

        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            bubbles
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        // Reset zoom
        this.resetZoom();
    }

    /**
     * Calculate community bubble radius based on volume/wallet count
     */
    getCommunityRadius(community) {
        return Math.sqrt(community.walletCount) * 8 + 30;
    }

    /**
     * Render Level 2: Community Drilldown
     */
    renderLevel2(data, onWalletClick) {
        this.clear();
        this.currentLevel = 2;

        const { nodes, edges } = data;

        // Create force simulation
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(15));

        // Draw edges with soft opacity
        const links = this.g.selectAll('.edge')
            .data(edges)
            .join('line')
            .attr('class', 'edge')
            .attr('stroke', '#cbd5e0')
            .attr('stroke-opacity', d => 0.15 + d.recency * 0.25)
            .attr('stroke-width', d => Math.sqrt(d.amount) / 2);

        // Draw nodes
        const nodeElements = this.g.selectAll('.wallet-node')
            .data(nodes)
            .join('g')
            .attr('class', 'wallet-node')
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                if (onWalletClick) onWalletClick(d);
            })
            .on('mouseover', (event, d) => this.showWalletTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .call(this.drag(this.simulation));

        // Add wallet node shapes - Unified to Circles
        nodeElements.each((d, i, nodes) => {
            const node = d3.select(nodes[i]);
            const size = 12;

            node.append('circle')
                .attr('r', size)
                .attr('fill', this.colors[d.riskLevel])
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);
        });

        // Add labels (optional, based on settings)
        const labels = this.g.selectAll('.wallet-label')
            .data(nodes.filter(d => d.suspicionScore > 0.7))
            .join('text')
            .attr('class', 'wallet-label node-label')
            .attr('dx', 15)
            .attr('dy', '.35em')
            .style('font-size', '10px')
            .style('fill', '#4a5568')
            .text(d => d.label);

        // Update positions on tick
        this.simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        this.resetZoom();
    }

    /**
     * Render Level 3: Ego Graph
     */
    renderLevel3(data, onWalletClick) {
        this.clear();
        this.currentLevel = 3;

        // data coming from generateEgoGraph might be different structure
        // But usually it has new nodes and links
        const { nodes, links } = data; // Assuming data structure passed from generateEgoGraph
        // If data is structured as centerNode, incomingNodes etc, we need to flatten it or use it as is.
        // Let's assume generateEgoGraph returns a standard d3 graph object {nodes, links} or similar
        // Looking at main-crypto.js, generateEgoGraph returns "egoData".
        // Let's inspect generateEgoGraph in graph-engine.js if needed, or just assume it returns {nodes, links}
        // Actually, in the previous file view of graph-renderer-crypto.js, renderLevel3 expected {centerNode, incomingNodes...}
        // This implies generateEgoGraph returns that structured object.
        // However, we want to support a more generic force graph for 3-hops.
        // So we will ignore the structured layout and just use force simulation on all nodes.

        // Let's see if we can adapt the data.
        // If data has 'nodes' and 'links' (standard graph), use them.
        // If data has centerNode etc, flatten them.

        let graphNodes = [];
        let graphLinks = [];

        if (data.nodes && data.links) {
            graphNodes = data.nodes;
            graphLinks = data.links;
        } else {
            // Fallback for structured object if generateEgoGraph wasn't updated to return raw graph
            const { centerNode, incomingNodes, outgoingNodes, intermediateNodes, edges } = data;
            graphNodes = [centerNode, ...incomingNodes, ...outgoingNodes, ...(intermediateNodes || [])];
            graphLinks = edges;
        }

        // Create simulation
        this.simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphLinks).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(20));

        // Draw edges with direction arrows
        const link = this.g.selectAll('.edge')
            .data(graphLinks)
            .join('line')
            .attr('class', 'edge')
            .attr('stroke', '#cbd5e0')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.max(1, Math.sqrt(d.amount || 1) / 2))
            .attr('marker-end', 'url(#arrowhead)');

        // Draw Link Labels (Values)
        const linkLabel = this.g.selectAll('.link-label')
            .data(graphLinks)
            .join('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('dy', -5)
            .text(d => d.amount ? d.amount.toFixed(1) : "")
            .style('fill', '#ccc')
            .style('font-size', '10px')
            .style('pointer-events', 'none');

        // Add arrowhead marker
        this.svg.append('defs').selectAll('marker')
            .data(['arrowhead'])
            .join('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20) // Adjusted for node radius
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#cbd5e0');

        // Draw nodes
        const nodeElements = this.g.selectAll('.wallet-node')
            .data(graphNodes)
            .join('circle')
            .attr('class', 'wallet-node')
            .attr('r', d => d.id === (data.centerNode?.id || '') ? 15 : 10)
            .attr('fill', d => this.colors[d.riskLevel] || '#999')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                if (onWalletClick) onWalletClick(d);
            })
            .call(this.drag(this.simulation));

        // Add labels
        const labels = this.g.selectAll('.wallet-label')
            .data(graphNodes)
            .join('text')
            .attr('class', 'wallet-label node-label')
            .attr('dx', 15)
            .attr('dy', '.35em')
            .style('font-size', '10px')
            .style('fill', '#fff') // White text
            .text(d => d.label || d.id.substring(0, 6));

        // Update positions
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            linkLabel
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);

            nodeElements
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        this.resetZoom();
    }

    /**
     * Drag behavior for nodes
     */
    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    /**
     * Show community tooltip
     */
    showCommunityTooltip(event, d) {
        // This would be implemented with the wallet popup component
        console.log('Show tooltip for community:', d);
    }

    /**
     * Show wallet tooltip
     */
    showWalletTooltip(event, d) {
        console.log('Show tooltip for wallet:', d);
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        // Implemented with wallet popup component
    }

    /**
     * Clear visualization
     */
    clear() {
        if (this.simulation) {
            this.simulation.stop();
        }
        this.g.selectAll('*').remove();
    }

    /**
     * Reset zoom to fit content
     */
    resetZoom() {
        this.svg.transition()
            .duration(500)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    /**
     * Zoom in/out
     */
    zoomIn() {
        this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.3);
    }

    zoomOut() {
        this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.7);
    }
}

// Export
window.GraphRenderer = GraphRenderer;
