/**
 * GRAPH RENDERER
 * Handles D3.js visualization for all graph levels
 */

class GraphRenderer {
    constructor(container) {
        this.container = d3.select(container);
        this.svg = null;
        this.g = null;
        this.simulation = null;
        this.currentLevel = 1;
        this.colors = {
            low: '#22c55e',
            medium: '#f97316',
            high: '#ef4444'
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
            .attr('fill-opacity', 0.7)
            .attr('stroke', d => this.colors[d.riskLevel])
            .attr('stroke-width', 3)
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
            .style('font-weight', '700')
            .style('fill', '#fff')
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

        // Draw edges
        const links = this.g.selectAll('.edge')
            .data(edges)
            .join('line')
            .attr('class', 'edge')
            .attr('stroke', '#cbd5e1') // Lighter grey for better visibility on dark bg
            .attr('stroke-opacity', d => 0.4 + d.recency * 0.6)
            .attr('stroke-width', d => Math.max(1, Math.sqrt(d.amount) / 2));

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

        // Add wallet node shapes based on role
        nodeElements.each((d, i, nodes) => {
            const node = d3.select(nodes[i]);
            const size = 12;

            switch (d.role) {
                case 'source':
                    node.append('path')
                        .attr('d', `M${-size},${-size} L${size},0 L${-size},${size} Z`) // Diamond
                        .attr('fill', this.colors[d.riskLevel])
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2);
                    break;
                case 'mule':
                    node.append('path')
                        .attr('d', `M0,${-size} L${size},${size} L${-size},${size} Z`) // Triangle
                        .attr('fill', this.colors[d.riskLevel])
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2);
                    break;
                case 'aggregator':
                    node.append('rect')
                        .attr('x', -size)
                        .attr('y', -size)
                        .attr('width', size * 2)
                        .attr('height', size * 2)
                        .attr('fill', this.colors[d.riskLevel])
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2);
                    break;
                default:
                    node.append('circle')
                        .attr('r', size)
                        .attr('fill', this.colors[d.riskLevel])
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2);
            }
        });

        // Add labels (optional, based on settings)
        const labels = this.g.selectAll('.wallet-label')
            .data(nodes.filter(d => d.suspicionScore > 0.7))
            .join('text')
            .attr('class', 'wallet-label node-label')
            .attr('dx', 15)
            .attr('dy', '.35em')
            .style('font-size', '10px')
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

        const { centerNode, incomingNodes, outgoingNodes, intermediateNodes, edges } = data;
        const allNodes = [centerNode, ...incomingNodes, ...outgoingNodes, ...intermediateNodes];

        // Position center node
        centerNode.fx = this.width / 2;
        centerNode.fy = this.height / 2;

        // Position incoming nodes on the left
        incomingNodes.forEach((node, i) => {
            node.x = this.width / 4;
            node.y = this.height / 2 + (i - incomingNodes.length / 2) * 40;
        });

        // Position outgoing nodes on the right
        outgoingNodes.forEach((node, i) => {
            node.x = this.width * 3 / 4;
            node.y = this.height / 2 + (i - outgoingNodes.length / 2) * 40;
        });

        // Create simulation
        this.simulation = d3.forceSimulation(allNodes)
            .force('link', d3.forceLink(edges).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('collision', d3.forceCollide().radius(20));

        // Draw edges with direction arrows
        const links = this.g.selectAll('.edge')
            .data(edges)
            .join('line')
            .attr('class', 'edge')
            .attr('stroke', '#94a3b8')
            .attr('stroke-opacity', d => 0.3 + d.recency * 0.5)
            .attr('stroke-width', d => Math.sqrt(d.amount) / 2)
            .attr('marker-end', 'url(#arrowhead)');

        // Add arrowhead marker
        this.svg.append('defs').selectAll('marker')
            .data(['arrowhead'])
            .join('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#94a3b8');

        // Draw nodes similar to Level 2
        const nodeElements = this.g.selectAll('.wallet-node')
            .data(allNodes)
            .join('circle')
            .attr('class', d => d.id === centerNode.id ? 'wallet-node center-node' : 'wallet-node')
            .attr('r', d => d.id === centerNode.id ? 18 : 12)
            .attr('fill', d => this.colors[d.riskLevel])
            .attr('stroke', d => d.id === centerNode.id ? '#3b82f6' : '#fff')
            .attr('stroke-width', d => d.id === centerNode.id ? 4 : 2)
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                if (onWalletClick) onWalletClick(d);
            })
            .on('mouseover', (event, d) => this.showWalletTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .call(this.drag(this.simulation));

        // Add labels
        const labels = this.g.selectAll('.wallet-label')
            .data(allNodes)
            .join('text')
            .attr('class', 'wallet-label node-label')
            .attr('dx', 15)
            .attr('dy', '.35em')
            .style('font-size', '10px')
            .text(d => d.label);

        // Update positions
        this.simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

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
