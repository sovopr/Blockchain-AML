/**
 * WALLET POPUP
 * Shows quick summary popup for wallets
 */

class WalletPopup {
    constructor() {
        this.popup = d3.select('#wallet-popup');
        this.isVisible = false;
    }

    /**
     * Show popup for a wallet
     */
    show(wallet, x, y) {
        const content = this.popup.select('.popup-content');
        content.html('');

        // Wallet ID
        content.append('div')
            .attr('class', 'popup-wallet-id')
            .text(wallet.fullAddress || wallet.id);

        // Suspicion score with meter
        const scoreSection = content.append('div').attr('class', 'popup-score');
        scoreSection.append('div')
            .attr('class', 'popup-score-label')
            .text(`Suspicion Score: ${Math.round(wallet.suspicionScore * 100)}%`);

        const scoreBar = scoreSection.append('div').attr('class', 'popup-score-bar');
        scoreBar.append('div')
            .attr('class', 'popup-score-fill')
            .style('width', `${wallet.suspicionScore * 100}%`)
            .style('background-color', this.getRiskColor(wallet.riskLevel));

        // Role tag
        content.append('div')
            .style('margin', '12px 0')
            .style('padding', '4px 12px')
            .style('background', this.getRiskColor(wallet.riskLevel) + '20')
            .style('color', this.getRiskColor(wallet.riskLevel))
            .style('border-radius', '16px')
            .style('display', 'inline-block')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text(`Role: ${wallet.role.charAt(0).toUpperCase() + wallet.role.slice(1)}`);

        // Stats grid
        const stats = content.append('div').attr('class', 'popup-stats');

        stats.append('div').attr('class', 'popup-stat').html(`
            <div class="popup-stat-label">Incoming</div>
            <div class="popup-stat-value">${wallet.inDegree || 0}</div>
        `);

        stats.append('div').attr('class', 'popup-stat').html(`
            <div class="popup-stat-label">Outgoing</div>
            <div class="popup-stat-value">${wallet.outDegree || 0}</div>
        `);

        stats.append('div').attr('class', 'popup-stat').html(`
            <div class="popup-stat-label">Volume</div>
            <div class="popup-stat-value">$${Math.round(wallet.totalVolume || 0)}</div>
        `);

        stats.append('div').attr('class', 'popup-stat').html(`
            <div class="popup-stat-label">Risk</div>
            <div class="popup-stat-value" style="color: ${this.getRiskColor(wallet.riskLevel)}">${wallet.riskLevel.toUpperCase()}</div>
        `);

        // Position popup
        this.popup
            .style('left', `${Math.min(x + 20, window.innerWidth - 350)}px`)
            .style('top', `${Math.min(y, window.innerHeight - 300)}px`)
            .classed('hidden', false);

        this.isVisible = true;
    }

    /**
     * Hide popup
     */
    hide() {
        this.popup.classed('hidden', true);
        this.isVisible = false;
    }

    /**
     * Get risk color
     */
    getRiskColor(riskLevel) {
        const colors = {
            low: '#22c55e',
            medium: '#f97316',
            high: '#ef4444'
        };
        return colors[riskLevel] || colors.low;
    }
}

// Close button handler
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('#wallet-popup .popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('wallet-popup').classList.add('hidden');
        });
    }
});

window.WalletPopup = WalletPopup;
