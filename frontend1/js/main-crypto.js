/**
 * MAIN APP - CRYPTO.COM THEME
 */

let app = {
    dataProcessor: null,
    graphEngine: null,
    patternDetector: null,
    graphRenderer: null
};

// Initialize app
async function init() {
    console.log('🚀 Initializing Smurfing Hunter...');
    showLoading(true);

    try {
        // Initialize data processor
        app.dataProcessor = new DataProcessor();
        const success = await app.dataProcessor.loadData();

        if (!success) {
            alert('Failed to load transaction data');
            return;
        }

        // Initialize engines
        app.graphEngine = new GraphEngine(app.dataProcessor);
        app.patternDetector = new PatternDetector(app.dataProcessor);
        app.graphRenderer = new GraphRenderer('#graph-container');

        // Detect patterns
        app.patternDetector.detectAllPatterns();

        // Setup controls
        setupControls();

        // Render initial view
        renderGraph();
        renderDashboard();

        showLoading(false);
        console.log('✅ App initialized successfully');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        alert('Failed to initialize: ' + error.message);
        showLoading(false);
    }
}

// Setup event listeners
function setupControls() {
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

    // Level select
    document.getElementById('level-select').addEventListener('change', (e) => {
        const level = parseInt(e.target.value);
        renderGraph(level);
    });

    // ... (rest of listeners)
}

// Render graph
function renderGraph(level) {
    // Default to current selection if level not provided
    if (!level) {
        level = parseInt(document.getElementById('level-select').value);
    }

    if (level === 1) {
        console.log("Rendering Level 1: Global Bubbles");
        const data = app.graphEngine.generateGlobalView();
        app.graphRenderer.renderLevel1(data, (community) => {
            console.log('Community clicked:', community);
            // Optional: Auto-switch to Level 2 filtered by this community
            // For now, adhere to manual level switching
        });
    } else if (level === 2) {
        console.log("Rendering Level 2: Communities Graph");
        const data = app.graphEngine.generateNetworkView();
        app.graphRenderer.renderLevel2(data, (wallet) => {
            investigateWallet(wallet.id);
        });
    } else if (level === 3) {
        // Restore last viewed wallet if available, else default to top suspect
        if (app.currentWalletId) {
            investigateWallet(app.currentWalletId);
        } else {
            const topWallet = app.dataProcessor.getTopSuspiciousWallets(1)[0];
            if (topWallet) investigateWallet(topWallet.id);
        }
    }
}

// Render dashboard
function renderDashboard() {
    // Render Top 50
    const top50 = app.dataProcessor.getTopSuspiciousWallets(50);
    const tbody = document.getElementById('top-50-body');

    tbody.innerHTML = top50.map((wallet, idx) => {
        const patterns = app.patternDetector.getWalletPatterns(wallet.id);
        const primaryPattern = patterns.length > 0 ? patterns[0].type : 'none';

        const scorePercent = Math.round(wallet.suspicionScore * 100);
        let statusClass = 'status-low';
        if (wallet.riskLevel === 'high') statusClass = 'status-high';
        else if (wallet.riskLevel === 'medium') statusClass = 'status-medium';

        return `
            <tr onclick="investigateWallet('${wallet.id}')">
                <td style="color: #6B7A97;">${idx + 1}</td>
                <td style="font-family: 'SF Mono', monospace; font-size: 0.8125rem;">
                    ${wallet.id.substring(0, 16)}...
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${scorePercent}%
                    </span>
                </td>
                <td style="text-transform: capitalize;">${primaryPattern}</td>
                <td style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;"
                            onclick="event.stopPropagation(); investigateWallet('${wallet.id}')">
                        View
                    </button>
                    <button class="btn" style="padding: 6px 12px; font-size: 0.75rem; background-color: #ef4444; color: white; border: none; cursor: pointer;"
                            onclick="event.stopPropagation(); this.innerText = 'Banned'; this.disabled = true; this.style.opacity = '0.6';">
                        Ban
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Render alerts
    const patterns = app.patternDetector.getAllPatterns();
    const alerts = [];

    patterns.fanOut.slice(0, 4).forEach(p => {
        alerts.push({
            type: 'FAN-OUT DETECTED',
            wallet: p.walletId,
            description: p.reason,
            severity: 'high'
        });
    });

    patterns.peelingChains.slice(0, 4).forEach(p => {
        alerts.push({
            type: 'PEELING CHAIN',
            wallet: p.walletId,
            description: p.reason,
            severity: 'medium'
        });
    });

    const alertsList = document.getElementById('alerts-list');
    if (alertsList) {
        alertsList.innerHTML = alerts.map(alert => {
            const severityClass = alert.severity === 'high' ? 'alert-high' : 'alert-medium';
            const severityColor = alert.severity === 'high' ? '#EA3943' : '#FFA726';

            return `
                <div class="alert-item ${severityClass}" onclick="investigateWallet('${alert.wallet}')">
                    <div class="alert-type" style="color: ${severityColor};">
                        ${alert.type}
                    </div>
                    <div class="alert-wallet">
                        ${alert.wallet.substring(0, 24)}...
                    </div>
                    <div class="alert-description">
                        ${alert.description}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Start live updates if not already running
    if (!window.alertsInterval) {
        window.alertsInterval = setInterval(() => {
            updateLiveAlerts();
        }, 5000); // Update every 5 seconds
    }
}

function updateLiveAlerts() {
    // Mock new alerts arriving from a stream
    const newAlertTypes = ['Structuring', 'Fan-Out', 'Rapid Movement', 'High Value Transfer'];
    const randomType = newAlertTypes[Math.floor(Math.random() * newAlertTypes.length)];
    const severity = Math.random() > 0.7 ? 'high' : 'medium';

    // Create new alert object
    const newAlert = {
        type: randomType.toUpperCase(),
        wallet: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        description: `New suspicious activity detected just now.`,
        severity: severity
    };

    const alertsList = document.getElementById('alerts-list');
    const severityClass = newAlert.severity === 'high' ? 'alert-high' : 'alert-medium';
    const severityColor = newAlert.severity === 'high' ? '#EA3943' : '#FFA726'; // Red or Orange

    const alertHTML = `
        <div class="alert-item ${severityClass}" style="animation: fadeInUp 0.5s ease;">
            <div class="alert-type" style="color: ${severityColor};">
                ${newAlert.type}
            </div>
            <div class="alert-wallet">
                ${newAlert.wallet.substring(0, 24)}...
            </div>
            <div class="alert-description">
                ${newAlert.description}
            </div>
        </div>
    `;

    // Prepend new alert and remove last if too many
    if (alertsList) {
        alertsList.insertAdjacentHTML('afterbegin', alertHTML);
        if (alertsList.children.length > 8) {
            alertsList.lastElementChild.remove();
        }
    }
}

// Investigate wallet
function investigateWallet(walletId) {
    console.log('Investigating wallet:', walletId);
    app.currentWalletId = walletId; // Store for navigation context

    const egoData = app.graphEngine.generateEgoGraph(walletId, 3);

    if (egoData) {
        app.graphRenderer.renderLevel3(egoData, (wallet) => {
            console.log('Wallet clicked:', wallet.id);
        });

        document.getElementById('level-select').value = '3';

        // --- NEW: Fetch Real Backend Report ---
        const detailPanel = document.querySelector('.sidebar');
        // We'll append/update the police report in the sidebar like the Streamlit app did

        fetch(`/api/wallet/${walletId}/report`)
            .then(res => res.json())
            .then(data => {
                const reportHtml = data.report;

                // Check if a report container already exists
                let reportContainer = document.getElementById('backend-report-container');
                if (!reportContainer) {
                    reportContainer = document.createElement('div');
                    reportContainer.id = 'backend-report-container';
                    // Removed 'card' class to let the report's internal styling take over
                    reportContainer.style.marginTop = '0px';
                    reportContainer.style.marginBottom = '20px';
                    // reportContainer.style.border = '1px solid var(--accent-primary)'; // Handled by report HTML

                    // Insert at the top of the sidebar (before View Settings)
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) {
                        sidebar.insertBefore(reportContainer, sidebar.firstChild);
                    }
                }

                reportContainer.innerHTML = reportHtml;

                // --- NEW: Add Button for Sankey and SAR ---
                const btnId = 'view-sankey-btn';
                if (!document.getElementById(btnId)) {
                    // Container for buttons
                    const btnContainer = document.createElement('div');
                    btnContainer.style.display = 'flex';
                    btnContainer.style.gap = '10px';
                    btnContainer.style.marginTop = '10px';

                    const btn = document.createElement('button');
                    btn.id = btnId;
                    btn.className = 'btn btn-primary';
                    btn.style.width = '100%';
                    btn.textContent = '🌊 View Sankey';
                    btn.onclick = () => renderSankeyView(walletId);

                    const sarBtn = document.createElement('button');
                    sarBtn.id = 'view-sar-btn';
                    sarBtn.className = 'btn btn-secondary';
                    sarBtn.style.width = '100%';
                    sarBtn.textContent = '📄 Generate SAR';
                    sarBtn.onclick = () => renderSARReport(walletId);

                    btnContainer.appendChild(btn);
                    btnContainer.appendChild(sarBtn);
                    reportContainer.appendChild(btnContainer);
                }
            })
            .catch(err => console.error('Error fetching report:', err));
    }
}

function renderSankeyView(walletId) {
    showLoading(true);
    fetch(`/api/wallet/${walletId}/sankey`)
        .then(res => res.json())
        .then(data => {
            showLoading(false);
            if (data.error) {
                alert(data.error);
                return;
            }
            drawSankey(data);
        })
        .catch(err => {
            showLoading(false);
            console.error(err);
        });
}

function drawSankey(data) {
    const container = document.getElementById('graph-container');
    container.innerHTML = ''; // Clear existing graph

    // Add Back Button
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.style.position = 'absolute';
    backBtn.style.top = '20px';
    backBtn.style.left = '20px';
    backBtn.style.zIndex = '100';
    backBtn.textContent = '← Back to Graph';
    backBtn.onclick = () => {
        container.innerHTML = ''; // Clear Sankey
        // Re-initialize GraphRenderer because the SVG was destroyed by clearing innerHTML
        app.graphRenderer = new GraphRenderer('#graph-container');
        // Re-render the graph view
        renderGraph();
    };
    container.appendChild(backBtn);

    // Setup D3 Sankey
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#graph-container').append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#0a0b1e');

    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[50, 50], [width - 50, height - 50]]);

    const { nodes, links } = sankey({
        nodes: data.nodes.map(d => Object.assign({}, d)),
        links: data.links.map(d => Object.assign({}, d))
    });

    // Draw Links
    const link = svg.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => d.color)
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .style("opacity", 0.5);

    link.on("mouseover", function () {
        d3.select(this).style("opacity", 0.8).attr("stroke", "#fff");
    }).on("mouseout", function (d) {
        d3.select(this).style("opacity", 0.5).attr("stroke", d => d.originalColor || d.color);
    });

    // Draw Nodes
    const node = svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => d.color);

    node.append("title")
        .text(d => `${d.name}\n${d.value ? d.value.toFixed(2) : 0} ETH`);

    node.on("mouseover", function () {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
    }).on("mouseout", function () {
        d3.select(this).attr("stroke", null);
    });

    // Node Labels
    svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name) // Use 'name' property from API
        .style("fill", "#e2e8f0")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("font-family", "Inter, sans-serif")
        .style("text-shadow", "0 1px 4px rgba(0,0,0,0.8)"); // Ensure readability

    // Validate title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Money Flow Tracer (Peeling Analysis)");
}

function renderSARReport(walletId) {
    showLoading(true);
    fetch(`/api/wallet/${walletId}/sar`)
        .then(res => res.json())
        .then(data => {
            showLoading(false);
            if (data.error) { alert(data.error); return; }

            // Show new modal
            const modal = document.getElementById('sar-modal');
            const content = document.getElementById('sar-content');
            if (modal && content) {
                content.textContent = data.sar;
                modal.style.display = 'flex';
            } else {
                // Fallback if modal not present
                const win = window.open("", "SAR Report", "width=800,height=600");
                win.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${data.sar}</pre>`);
            }
        })
        .catch(err => {
            showLoading(false);
            console.error(err);
        });
}

window.investigateWallet = investigateWallet;

// Utility functions
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
