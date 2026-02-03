/**
 * EXPLAINER
 * "Why Flagged" explanations for wallets
 */

class Explainer {
    constructor(patternDetector) {
        this.patternDetector = patternDetector;
    }

    /**
     * Show explanation panel for a wallet
     */
    showExplanation(walletId) {
        const explanation = this.patternDetector.explainWallet(walletId);
        if (!explanation) return;

        const panel = d3.select('#detail-content');
        panel.html('');

        // Summary
        panel.append('div')
            .style('padding', '16px')
            .style('background', '#f8fafc')
            .style('border-radius', '8px')
            .style('margin-bottom', '20px')
            .html(`<p style="margin: 0; line-height: 1.6;">${explanation.summary}</p>`);

        // Detailed explanations
        if (explanation.explanations.length > 0) {
            panel.append('h3')
                .style('margin-bottom', '12px')
                .text('Why This Wallet Was Flagged');

            explanation.explanations.forEach((exp, idx) => {
                const item = panel.append('div')
                    .style('padding', '12px')
                    .style('border-left', `3px solid ${this.getSeverityColor(exp.severity)}`)
                    .style('background', '#fff')
                    .style('margin-bottom', '12px')
                    .style('border-radius', '4px');

                item.append('div')
                    .style('font-weight', '600')
                    .style('margin-bottom', '4px')
                    .html(`${idx + 1}. ${exp.parameter.replace(/_/g, ' ').toUpperCase()}`);

                item.append('div')
                    .style('font-size', '14px')
                    .style('color', '#64748b')
                    .style('margin-bottom', '8px')
                    .html(`Value: <strong>${exp.value}</strong> (Threshold: ${exp.threshold})`);

                item.append('div')
                    .style('font-size', '14px')
                    .style('line-height', '1.5')
                    .text(exp.description);
            });
        }
    }

    /**
     * Get severity color
     */
    getSeverityColor(severity) {
        const colors = {
            low: '#22c55e',
            medium: '#f97316',
            high: '#ef4444'
        };
        return colors[severity] || colors.low;
    }
}

window.Explainer = Explainer;
