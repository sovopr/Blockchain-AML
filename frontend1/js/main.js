/**
 * MAIN APPLICATION
 * The Smurfing Hunter - AML Intelligence Platform
 */

let app = {
    dataProcessor: null,
    graphEngine: null,
    patternDetector: null,
    graphRenderer: null,
    walletPopup: null,
    dashboard: null,
    animationEngine: null,
    explainer: null,
    currentLevel: 1,
    currentView: null
};

/**
 * Initialize application
 */
async function init() {
    console.log('🎯 Initializing The Smurfing Hunter...');
    showLoading(true);

    try {
        // Initialize data processor and load data
        app.dataProcessor = new DataProcessor();
        const success = await app.dataProcessor.loadData();

        if (!success) {
            showError('Failed to load data');
            return;
        }

        // Initialize other components
        app.graphEngine = new GraphEngine(app.dataProcessor);
        app.patternDetector = new PatternDetector(app.dataProcessor);
        app.graphRenderer = new GraphRenderer('#graph-container');
        app.walletPopup = new WalletPopup();
        app.dashboard = new Dashboard(app.dataProcessor, app.patternDetector);
        app.explainer = new Explainer(app.patternDetector);

        // Detect patterns
        app.patternDetector.detectAllPatterns();

        // Show statistics
        const stats = app.dataProcessor.getStatistics();
        console.log('📊 Statistics:', stats);

        // Render initial view (Level 1)
        showLevel1();

        // Setup event listeners
        setupEventListeners();

        // Render dashboard
        app.dashboard.update(
            (walletId) => showLevel3(walletId),
            (walletId) => showLevel3(walletId)
        );

        showLoading(false);
        console.log('✅ Application initialized successfully');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        showError('Application failed to initialize: ' + error.message);
        showLoading(false);
    }
}

/**
 * Show Level 1: Global Overview
 */
function showLevel1() {
    console.log('Rendering Level 1: Global Overview');
    app.currentLevel = 1;
    app.currentView = app.graphEngine.generateGlobalView();

    app.graphRenderer.renderLevel1(app.currentView, (community) => {
        showLevel2(community.id);
    });

    updateBreadcrumb('Global Overview');
}

/**
 * Show Level 2: Community Drilldown
 */
function showLevel2(communityId) {
    console.log('Rendering Level 2: Community', communityId);
    app.currentLevel = 2;
    app.currentView = app.graphEngine.generateCommunityView(communityId);

    if (!app.currentView) {
        console.error('Failed to generate community view');
        return;
    }

    app.graphRenderer.renderLevel2(app.currentView, (wallet) => {
        showLevel3(wallet.id);
    });

    updateBreadcrumb(`Global Overview > Community ${communityId.substring(0, 8)}`);

    // Show filters
    document.getElementById('time-filter').style.display = 'block';
    document.getElementById('token-filter').style.display = 'block';
    document.getElementById('amount-filter').style.display = 'block';
}

/**
 * Show Level 3: Wallet Ego Graph
 */
function showLevel3(walletId) {
    console.log('Rendering Level 3: Wallet', walletId);
    app.currentLevel = 3;
    app.currentView = app.graphEngine.generateEgoGraph(walletId);

    if (!app.currentView) {
        console.error('Failed to generate ego graph');
        return;
    }

    app.graphRenderer.renderLevel3(app.currentView, (wallet) => {
        showWalletDetails(wallet.id);
    });

    updateBreadcrumb(`Global Overview > ... > Wallet ${walletId.substring(0, 8)}`);

    // Show wallet details panel
    showWalletDetails(walletId);
}

/**
 * Show wallet details panel (Level 4)
 */
function showWalletDetails(walletId) {
    const detailPanel = document.getElementById('detail-panel');
    const detailTitle = document.getElementById('detail-title');

    detailTitle.textContent = `Wallet: ${walletId.substring(0, 12)}...`;

    // Show explanation
    app.explainer.showExplanation(walletId);

    // Show transaction ledger
    const ledger = app.graphEngine.generateTransactionLedger(walletId);
    if (ledger) {
        const content = d3.select('#detail-content');

        content.append('h3')
            .style('margin-top', '24px')
            .style('margin-bottom', '12px')
            .text('Transaction History');

        const table = content.append('table')
            .attr('class', 'data-table')
            .style('font-size', '12px');

        table.append('thead').append('tr').html(`
            <th>Direction</th>
            <th>Counterparty</th>
            <th>Amount</th>
            <th>Token</th>
            <th>Date</th>
        `);

        const tbody = table.append('tbody');
        ledger.transactions.slice(0, 20).forEach(tx => {
            tbody.append('tr').html(`
                <td>${tx.direction === 'incoming' ? '←' : '→'}</td>
                <td class="truncate" style="max-width: 100px;" title="${tx.direction === 'incoming' ? tx.Source : tx.Target}">
                    ${(tx.direction === 'incoming' ? tx.Source : tx.Target).substring(0, 10)}...
                </td>
                <td>${parseFloat(tx.Amount).toFixed(2)}</td>
                <td>${tx.Token_Type}</td>
                <td>${new Date(tx.Timestamp).toLocaleDateString()}</td>
            `);
        });
    }

    detailPanel.classList.remove('hidden');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Close detail panel
    document.getElementById('close-detail').addEventListener('click', () => {
        document.getElementById('detail-panel').classList.add('hidden');
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        app.graphRenderer.zoomIn();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        app.graphRenderer.zoomOut();
    });

    document.getElementById('zoom-reset').addEventListener('click', () => {
        app.graphRenderer.resetZoom();
    });

    // Search
    document.getElementById('global-search').addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length > 3) {
            const results = app.dataProcessor.searchWallets(query);
            console.log('Search results:', results);
            // Show search results dropdown (to be implemented)
        }
    });

    // Filters
    document.getElementById('time-slider').addEventListener('input', (e) => {
        const days = e.target.value;
        document.getElementById('time-value').textContent = `${days} days`;
        app.graphEngine.setFilters({ timeWindow: parseInt(days) });
        refreshCurrentView();
    });

    document.getElementById('min-amount').addEventListener('input', (e) => {
        const amount = e.target.value;
        document.getElementById('amount-value').textContent = `$${amount}`;
        app.graphEngine.setFilters({ minAmount: parseFloat(amount) });
        refreshCurrentView();
    });

    // Token type checkboxes
    document.querySelectorAll('#token-filter input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selected = Array.from(document.querySelectorAll('#token-filter input:checked'))
                .map(cb => cb.value);
            app.graphEngine.setFilters({ tokenTypes: selected });
            refreshCurrentView();
        });
    });

    // Reset filters
    document.getElementById('reset-filters').addEventListener('click', () => {
        app.graphEngine.setFilters({
            timeWindow: 90,
            tokenTypes: ['ETH', 'USDT'],
            minAmount: 0
        });
        document.getElementById('time-slider').value = 90;
        document.getElementById('time-value').textContent = 'All Time';
        document.getElementById('min-amount').value = 0;
        document.getElementById('amount-value').textContent = '$0';
        document.querySelectorAll('#token-filter input').forEach(cb => cb.checked = true);
        refreshCurrentView();
    });

    // Export buttons
    document.getElementById('export-csv').addEventListener('click', () => {
        exportData('csv');
    });

    document.getElementById('export-json').addEventListener('click', () => {
        exportData('json');
    });

    // Level select
    document.getElementById('level-select').addEventListener('change', (e) => {
        const level = parseInt(e.target.value);
        if (level === 1) {
            showLevel1();
        }
    });
}

/**
 * Refresh current view
 */
function refreshCurrentView() {
    if (app.currentLevel === 2 && app.currentView) {
        const communityId = app.currentView.communityId;
        showLevel2(communityId);
    }
}

/**
 * Update breadcrumb
 */
function updateBreadcrumb(text) {
    document.getElementById('breadcrumb').innerHTML = `
        <span class="breadcrumb-item active">${text}</span>
    `;
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
}

/**
 * Show error message
 */
function showError(message) {
    alert('Error: ' + message);
    console.error(message);
}

/**
 * Export data
 */
function exportData(format) {
    const data = app.graphEngine.exportData(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smurfing-hunter-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Start application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    init();
});
