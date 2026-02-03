/**
 * ENHANCED MAIN APPLICATION
 * Handles landing page, transitions, and enhanced interactions
 */

let enhancedApp = {
    dataProcessor: null,
    graphEngine: null,
    patternDetector: null,
    graphRenderer: null,
    currentView: 'overview'
};

// ========== LANDING PAGE ANIMATIONS ==========

function animateStats() {
    const statElements = document.querySelectorAll('.stat-value');
    statElements.forEach(stat => {
        const target = parseInt(stat.dataset.target);
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 30);
    });
}

// ========== INITIALIZATION ==========

async function initEnhancedApp() {
    console.log('🎯 Initializing Enhanced Smurfing Hunter...');

    // Animate stats
    setTimeout(animateStats, 1000);

    // Enter platform button
    document.getElementById('enter-platform').addEventListener('click', () => {
        document.getElementById('landing-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        loadApplication();
    });

    // Fullscreen toggle
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
}

async function loadApplication() {
    showLoading(true);

    try {
        // Initialize data processor
        enhancedApp.dataProcessor = new DataProcessor();
        const success = await enhancedApp.dataProcessor.loadData();

        if (!success) {
            alert('Failed to load data');
            return;
        }

        // Initialize engines
        enhancedApp.graphEngine = new GraphEngine(enhancedApp.dataProcessor);
        enhancedApp.patternDetector = new PatternDetector(enhancedApp.dataProcessor);
        enhancedApp.graphRenderer = new GraphRenderer('#graph-container');

        // Detect patterns
        enhancedApp.patternDetector.detectAllPatterns();

        // Setup navigation
        setupNavigation();

        // Setup controls
        setupControls();

        // Render initial view
        renderGraphView();
        renderThreatsView();

        showLoading(false);
        console.log('✅ Enhanced app initialized');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        alert('Failed to initialize: ' + error.message);
        showLoading(false);
    }
}

// ========== NAVIGATION ==========

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            // Update nav visual state
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.view === view);
            });

            // All views essentially show the same layout now
            // Overview = global view, Graph = last viewed, Threats = scroll to dashboard
            if (view === 'overview') {
                renderGraphView();
            } else if (view === 'threats') {
                // Scroll to dashboard section
                document.querySelector('.threats-container')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ========== CONTROLS ==========

function setupControls() {
    // Zoom controls
    document.getElementById('zoom-in-new').addEventListener('click', () => {
        enhancedApp.graphRenderer.zoomIn();
    });

    document.getElementById('zoom-out-new').addEventListener('click', () => {
        enhancedApp.graphRenderer.zoomOut();
    });

    document.getElementById('zoom-reset-new').addEventListener('click', () => {
        enhancedApp.graphRenderer.resetZoom();
    });

    // Level select
    document.getElementById('level-select-new').addEventListener('change', (e) => {
        const level = parseInt(e.target.value);
        if (level === 1) {
            renderGraphView();
        }
    });

    // Time slider
    document.getElementById('time-range-new').addEventListener('input', (e) => {
        const days = e.target.value;
        document.getElementById('time-val-new').textContent = `${days} days`;
        enhancedApp.graphEngine.setFilters({ timeWindow: parseInt(days) });
    });

    // Amount slider
    document.getElementById('amount-range-new').addEventListener('input', (e) => {
        const amount = e.target.value;
        document.getElementById('amount-val-new').textContent = `$${amount}`;
        enhancedApp.graphEngine.setFilters({ minAmount: parseFloat(amount) });
    });

    // Reset filters
    document.getElementById('reset-filters-new').addEventListener('click', () => {
        enhancedApp.graphEngine.setFilters({
            timeWindow: 90,
            tokenTypes: ['ETH', 'USDT'],
            minAmount: 0
        });
        document.getElementById('time-range-new').value = 90;
        document.getElementById('time-val-new').textContent = '90 days';
        document.getElementById('amount-range-new').value = 0;
        document.getElementById('amount-val-new').textContent = '$0';
    });

    // Search
    document.getElementById('cyber-search').addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length > 3) {
            const results = enhancedApp.dataProcessor.searchWallets(query);
            console.log('Search results:', results);
        }
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('wallet-modal').classList.remove('active');
    });
}

// ========== GRAPH RENDERING ==========

function renderGraphView() {
    const data = enhancedApp.graphEngine.generateGlobalView();

    enhancedApp.graphRenderer.renderLevel1(data, (community) => {
        console.log('Community clicked:', community);
        // Could drill down to level 2 here
    });
}

// ========== THREATS VIEW ==========

function renderThreatsView() {
    // Render Top 50
    const top50 = enhancedApp.dataProcessor.getTopSuspiciousWallets(50);
    const tbody = document.getElementById('top-50-body-new');

    tbody.innerHTML = top50.map((wallet, idx) => {
        const patterns = enhancedApp.patternDetector.getWalletPatterns(wallet.id);
        const primaryPattern = patterns.length > 0 ? patterns[0].type : 'none';

        const riskColor = wallet.riskLevel === 'high' ? '#ef4444' :
            wallet.riskLevel === 'medium' ? '#f97316' : '#22c55e';

        return `
            <tr style="border-left: 3px solid ${riskColor};" onclick="showWalletModal('${wallet.id}')">
                <td>${idx + 1}</td>
                <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">
                    ${wallet.id.substring(0, 12)}...
                </td>
                <td>
                    <span style="color: ${riskColor}; font-weight: 700;">
                        ${Math.round(wallet.suspicionScore * 100)}%
                    </span>
                </td>
                <td style="text-transform: capitalize;">${primaryPattern}</td>
                <td>
                    <button class="cyber-btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="event.stopPropagation(); investigateWallet('${wallet.id}')">
                        INVESTIGATE
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Render alerts
    const patterns = enhancedApp.patternDetector.getAllPatterns();
    const alerts = [];

    patterns.fanOut.slice(0, 3).forEach(p => {
        alerts.push({
            type: 'FAN-OUT DETECTED',
            wallet: p.walletId,
            description: p.reason,
            severity: 'high'
        });
    });

    patterns.peelingChains.slice(0, 3).forEach(p => {
        alerts.push({
            type: 'PEELING CHAIN',
            wallet: p.walletId,
            description: p.reason,
            severity: 'medium'
        });
    });

    const alertsList = document.getElementById('alerts-list-new');
    alertsList.innerHTML = alerts.map(alert => {
        const borderColor = alert.severity === 'high' ? '#ef4444' : '#f97316';
        return `
            <div class="alert-item-cyber" style="border-color: ${borderColor};" onclick="investigateWallet('${alert.wallet}')">
                <div style="font-size: 0.75rem; font-weight: 700; color: ${borderColor}; margin-bottom: 6px;">
                    ${alert.type}
                </div>
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">
                    ${alert.wallet.substring(0, 20)}...
                </div>
                <div style="font-size: 0.85rem; color: #94a3b8;">
                    ${alert.description}
                </div>
            </div>
        `;
    }).join('');
}

// ========== WALLET INVESTIGATION ==========

function investigateWallet(walletId) {
    console.log('Investigating wallet:', walletId);

    // Switch to graph view
    switchView('graph');

    // Render ego graph for this wallet
    const egoData = enhancedApp.graphEngine.generateEgoGraph(walletId, 2);

    if (egoData) {
        enhancedApp.graphRenderer.renderLevel3(egoData, (wallet) => {
            // When clicking a node in the ego graph, show its modal
            showWalletModal(wallet.id);
        });

        // Update level selector
        document.getElementById('level-select-new').value = '3';

        // Show a notification
        showNotification(`Now investigating: ${walletId.substring(0, 12)}...`);
    }
}

window.investigateWallet = investigateWallet;

// ========== WALLET MODAL ==========

function showWalletModal(walletId) {
    const wallet = enhancedApp.dataProcessor.getWallet(walletId);
    if (!wallet) return;

    const explanation = enhancedApp.patternDetector.explainWallet(walletId);
    const modal = document.getElementById('wallet-modal');
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: #00f5ff;">
            WALLET ANALYSIS
        </h2>
        <p style="font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; color: #64748b; margin-bottom: 30px;">
            ${walletId}
        </p>

        <div style="padding: 20px; background: rgba(0, 245, 255, 0.05); border-left: 3px solid #00f5ff; border-radius: 8px; margin-bottom: 30px;">
            <p style="line-height: 1.6;">${explanation.summary}</p>
        </div>

        ${explanation.explanations.length > 0 ? `
            <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: #00f5ff;">
                FLAGGED PARAMETERS
            </h3>
            ${explanation.explanations.map((exp, idx) => `
                <div style="padding: 16px; background: rgba(255, 255, 255, 0.03); border-left: 3px solid ${exp.severity === 'high' ? '#ef4444' : exp.severity === 'medium' ? '#f97316' : '#22c55e'
        }; border-radius: 6px; margin-bottom: 12px;">
                    <div style="font-weight: 700; margin-bottom: 8px;">
                        ${idx + 1}. ${exp.parameter.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px;">
                        Value: <strong>${exp.value}</strong> | Threshold: ${exp.threshold}
                    </div>
                    <div style="font-size: 0.9rem; line-height: 1.5;">
                        ${exp.description}
                    </div>
                </div>
            `).join('')}
        ` : ''}
    `;

    modal.classList.add('active');
}

window.showWalletModal = showWalletModal;

// ========== UTILITIES ==========

function showLoading(show) {
    const loading = document.getElementById('loading-cyber');
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function showNotification(message) {
    // Create a toast notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(255, 0, 255, 0.2));
        backdrop-filter: blur(10px);
        border: 1px solid #00f5ff;
        border-radius: 12px;
        padding: 16px 24px;
        color: white;
        font-size: 0.9rem;
        font-weight: 600;
        box-shadow: 0 0 30px rgba(0, 245, 255, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ========== START APP ==========

document.addEventListener('DOMContentLoaded', () => {
    initEnhancedApp();
});
