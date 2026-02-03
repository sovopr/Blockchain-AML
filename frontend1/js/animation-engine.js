/**
 * ANIMATION ENGINE
 * Animated transaction flows
 */

class AnimationEngine {
    constructor(svg) {
        this.svg = svg;
        this.particles = [];
        this.animationId = null;
    }

    /**
     * Start flow animations
     */
    startFlowAnimations(edges) {
        this.stopAnimations();

        // Create particles for high-value edges
        const topEdges = edges
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 20);

        topEdges.forEach(edge => {
            this.createParticle(edge);
        });
    }

    /**
     * Create animated particle on edge
     */
    createParticle(edge) {
        if (!edge.source || !edge.target) return;

        const particle = this.svg.append('circle')
            .attr('class', 'flow-particle')
            .attr('r', 4)
            .attr('fill', '#3b82f6')
            .attr('fill-opacity', 0.8);

        this.particles.push({ element: particle, edge, progress: 0 });
    }

    /**
     * Animate particles along edges
     */
    animateParticles() {
        this.particles.forEach(p => {
            p.progress += 0.01;

            if (p.progress > 1) {
                p.progress = 0;
            }

            const sourceX = p.edge.source.x || 0;
            const sourceY = p.edge.source.y || 0;
            const targetX = p.edge.target.x || 0;
            const targetY = p.edge.target.y || 0;

            const x = sourceX + (targetX - sourceX) * p.progress;
            const y = sourceY + (targetY - sourceY) * p.progress;

            p.element.attr('cx', x).attr('cy', y);
        });

        this.animationId = requestAnimationFrame(() => this.animateParticles());
    }

    /**
     * Stop animations
     */
    stopAnimations() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.particles.forEach(p => p.element.remove());
        this.particles = [];
    }
}

window.AnimationEngine = AnimationEngine;
