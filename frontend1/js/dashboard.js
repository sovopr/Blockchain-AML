/**
 * DASHBOARD
 * Top 50 suspicious wallets and alerts feed
 */

class Dashboard {
    constructor(dataProcessor, patternDetector) {
        this.dataProcessor = dataProcessor;
        this.patternDetector = patternDetector;
        this.tableBody = d3.select('#top-50-body');
        this.alertsContainer = d3.select('#alerts-container');
    }

    /**
     * Render Top 50 suspicious wallets table
     */
    renderTop50(onWalletClick) {
        const top50 = this.dataProcessor.getTopSuspiciousWallets(50);

        const rows = this.tableBody.selectAll('tr')
            .data(top50)
            .join('tr')
            .attr('class', d => `risk-${d.riskLevel}`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                if (onWalletClick) onWalletClick(d.id);
            });

        rows.html(d => {
            const patterns = this.patternDetector.getWalletPatterns(d.id);
            const primaryPattern = patterns.length > 0 ? patterns[0].type : 'none';

            return `
                <td>${top50.indexOf(d) + 1}</td>
                <td class="truncate" style="max-width: 150px;" title="${d.id}">${d.id.substring(0, 12)}...</td>
                <td>
                    <span class="suspicion-badge ${d.riskLevel}">
                        ${Math.round(d.suspicionScore * 100)}%
                    </span>
                </td>
                <td>${primaryPattern}</td>
                <td>
                    <button class="btn-secondary" style="padding: 4px 12px; font-size: 0.75rem;">
                        Investigate
                    </button>
                </td>
            `;
        });
    }

    /**
     * Generate and render alerts
     */
    renderAlerts(onAlertClick) {
        const patterns = this.patternDetector.getAllPatterns();
        const alerts = [];

        // Generate alerts from detected patterns
        patterns.fanOut.slice(0, 5).forEach(p => {
            alerts.push({
                type: 'Fan-Out Detected',
                walletId: p.walletId,
                description: p.reason,
                time: 'Just now',
                severity: 'high'
            });
        });

        patterns.peelingChains.slice(0, 3).forEach(p => {
            alerts.push({
                type: 'Peeling Chain',
                walletId: p.walletId,
                description: p.reason,
                time: '5 mins ago',
                severity: 'medium'
            });
        });

        patterns.fixedDelay.slice(0, 3).forEach(p => {
            alerts.push({
                type: 'Fixed Delay Coordination',
                walletId: p.walletId,
                description: p.reason,
                time: '15 mins ago',
                severity: 'medium'
            });
        });

        // Render alerts
        const alertItems = this.alertsContainer.selectAll('.alert-item')
            .data(alerts)
            .join('div')
            .attr('class', 'alert-item')
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                if (onAlertClick) onAlertClick(d.walletId);
            });

        alertItems.html(d => `
            <div class="alert-header">
                <span class="alert-type">${d.type}</span>
                <span class="alert-time">${d.time}</span>
            </div>
            <div class="alert-wallet">${d.walletId.substring(0, 16)}...</div>
            <div class="alert-description">${d.description}</div>
        `);
    }

    /**
     * Update dashboard with new data
     */
    update(onWalletClick, onAlertClick) {
        this.renderTop50(onWalletClick);
        this.renderAlerts(onAlertClick);
    }
}

window.Dashboard = Dashboard;
