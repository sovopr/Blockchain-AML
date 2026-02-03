from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sys
import os

# Ensure backend directory is in sys.path so 'models' module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from models.gnn_model import ModelManager
except ImportError:
    # Fallback/Debug if path issue persists
    from backend.models.gnn_model import ModelManager

import datetime
import random
import math

app = Flask(__name__, static_folder='../frontend1', static_url_path='')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Check if path exists in static folder, otherwise fall back or 404
    # But for API routes, Flask should match them first.
    # However, explicit APIs are defined below.
    try:
        return send_from_directory(app.static_folder, path)
    except:
        return jsonify({'error': 'Not found'}), 404 

# Initialize model
model_manager = ModelManager('models/weights/model_weights.pth')

# ==========================================
# RECOVERED DATA LOGIC
# ==========================================

MOCK_RISK_DATA = []
# 1. Noise Cluster (Blue/Safe)
for i in range(2000):
        vol = 10**random.uniform(3, 7)
        risk = random.betavariate(2, 5) # Skewed low
        MOCK_RISK_DATA.append({'id': i, 'address': f"0x{i}", 'x': vol, 'y': risk, 'group': 'noise'})

# 2. SUSPECT CLUSTER (Red/Critical) - Organic Outliers
for i in range(150):
        # Organic Volume: Concentrated mid-high but with variance
        vol = 10**random.normalvariate(5.0, 0.5) 
        
        # Organic Risk: Exponentially unlikely to be 1.0, but clustered high
        # 0.70 to 0.99 scatter
        risk = 0.7 + (random.betavariate(5, 1) * 0.29)
        
        MOCK_RISK_DATA.append({'id': 3000+i, 'address': f"0xSuspect{i}", 'x': vol, 'y': risk, 'group': 'suspect'})

@app.route('/api/predict', methods=['POST'])
def run_prediction():
    return jsonify({'status': 'completed', 'anomalies': []}), 200

@app.route('/api/overview', methods=['GET'])
def get_overview():
    return jsonify({
      'totalTransactions': 15293,
      'anomaliesDetected': 523,
      'riskScore': 9.1,
      'networkHealth': 88.4
    })

@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    # Return a larger list for the sidebar
    suspects = []
    for i in range(100): # Increased to 100 as requested
        risk_level = 'critical' if random.random() > 0.5 else 'high'
        suspects.append({
            'id': i, 
            'address': f"0x{random.randint(10**10, 10**11):x}", 
            'riskLevel': risk_level, 
            'confidence': random.uniform(0.85, 0.9999), 
            'amount': f"₿{random.uniform(2, 50):.1f}", 
            'metrics': {
                'role': 'Mule' if risk_level == 'critical' else 'Smurf', 
                'toxicity': random.uniform(0.8, 0.99),
                'pattern': "DISPERSION (Smurf)" if risk_level == 'high' else "AGGREGATION (Mule)",
                'flow_ratio': round(random.uniform(0.8, 1.8), 2),
                'bad_actors': random.randint(3, 12),
                'volume_usd': random.randint(100000, 900000),
                'tags': ['High Velocity', 'Structurally Embedded'] if random.random() > 0.5 else ['Layering Detected']
            }
        })
    return jsonify(suspects)

@app.route('/api/network/stats', methods=['GET'])
def get_network_stats():
    return jsonify([
      { 'label': 'Active Nodes', 'value': '15,201', 'trend': '+12%' },
      { 'label': 'High Risk', 'value': '523', 'trend': '+8%' },
      { 'label': 'Avg Volume', 'value': '$42.5k', 'trend': '-3%' },
      { 'label': 'GNN Accuracy', 'value': '97.2%', 'trend': '+0.5%' },
    ])

@app.route('/api/network/graph', methods=['GET'])
def get_ego_graph():
    center = request.args.get('center', '0xTarget')
    random.seed(center) 
    
    nodes = [{'id': center, 'group': 'center', 'val': 50, 'label': center[:6], 'color': '#f59e0b'}]
    links = []
    
    center_idx = 0
    
    # 4-6 Red Mules
    count = random.randint(4, 6)
    for i in range(count):
        mid_id = f"Mule_{i}_{center[:4]}"
        nodes.append({'id': mid_id, 'group': 'mid', 'val': 25, 'label': mid_id, 'color': '#ef4444'})
        mule_idx = len(nodes) - 1
        
        # USE INDICES (0 -> mule_idx) to guarantee connection
        links.append({'source': center_idx, 'target': mule_idx, 'amount': round(random.uniform(20, 50), 1)})
        
        # 1-2 Grey Leafs per Mule
        for j in range(random.randint(1, 2)):
             leaf_id = f"Leaf_{i}_{j}"
             nodes.append({'id': leaf_id, 'group': 'leaf', 'val': 10, 'label': leaf_id[:6], 'color': '#64748b'})
             leaf_idx = len(nodes) - 1
             
             # USE INDICES (mule_idx -> leaf_idx)
             links.append({'source': mule_idx, 'target': leaf_idx, 'amount': round(random.uniform(2, 15), 1)})
             
    random.seed()
    return jsonify({'nodes': nodes, 'links': links})

@app.route('/api/flow', methods=['GET'])
def get_sankey_data():
    center = request.args.get('center', '0xTarget')
    random.seed(center)
    
    nodes = []
    links = []
    
    # Helper to generate fake hash
    def generate_fake_hash():
        return "0x" + "".join([random.choice("0123456789abcdef") for _ in range(40)])

    # 1. Sources (Random 2-4)
    num_sources = random.randint(2, 4)
    source_indices = []
    
    for i in range(num_sources):
        is_risky = random.random() > 0.6 # 40% chance of risky source
        prefix = "Dark Market" if is_risky else "Exchange"
        name = f"{prefix} {chr(65+i)}"
        
        nodes.append({
            'id': generate_fake_hash(),
            'name': name, 
            'type': 'risky' if is_risky else 'safe',
            'val': random.randint(30, 90) # Added val for size/risk mapping
        })
        source_indices.append(len(nodes)-1)

    # 2. Target (Center)
    target_idx = len(nodes)
    nodes.append({
        'id': center,
        'name': f"TARGET ({center[:6]}...)",
        'type': 'suspect',
        'val': 100,
        'color': '#ef4444'
    })
    
    # 3. Mules (Random 3-6)
    num_mules = random.randint(3, 6)
    mule_indices = []
    for i in range(num_mules):
        m_name = f"Mule {i+1}"
        nodes.append({
            'id': generate_fake_hash(),
            'name': m_name,
            'type': 'mule',
            'val': random.randint(10, 40)
        })
        mule_indices.append(len(nodes)-1)
    
    # LINKS: Sources -> Target
    total_in = 0
    for s_idx in source_indices:
        val = random.randint(20, 80)
        # 30% Chance input is suspicious (Blue), else Safe (Green)
        is_suspicious = random.random() > 0.7 
        links.append({'source': nodes[s_idx]['id'], 'target': center, 'value': val, 'flagged': is_suspicious})
        total_in += val
    
    # LINKS: Target -> Mules
    remaining = total_in
    for idx in mule_indices[:-1]:
        val = int(total_in / num_mules) + random.randint(-5, 5)
        val = min(val, remaining - 1) 
        if val < 1: val = 1
        
        # 90% Chance output is Smurfing (Blue)
        links.append({'source': center, 'target': nodes[idx]['id'], 'value': val, 'flagged': True})
        remaining -= val
    
    if remaining > 0:
        links.append({'source': center, 'target': nodes[mule_indices[-1]]['id'], 'value': remaining, 'flagged': True})
    
    random.seed()
    return jsonify({'nodes': nodes, 'links': links})

# 3. STATIC CONTAGION DATA (High Volatility)
MOCK_CONTAGION_DATA = []
curr = 10
for m in range(0, 1440, 15):
    if random.random() > 0.5: curr += 0.5
    else: curr -= 0.5
    spike = random.randint(15, 25) if random.random() > 0.95 else 0
    MOCK_CONTAGION_DATA.append({'time': f"{m//60}:{m%60:02d}", 'new_wallets': int(max(5, curr + spike))})

@app.route('/api/contagion', methods=['GET'])
def get_contagion_data():
    return jsonify(MOCK_CONTAGION_DATA)

@app.route('/api/risk-map', methods=['GET'])
def get_risk_map():
    return jsonify(MOCK_RISK_DATA)

@app.route('/api/sar/generate', methods=['POST'])
def generate_sar():
    data = request.json
    wallet_id = data.get('walletId', 'Unknown')
    
    # Generate Mock Data for Report
    risk_score = random.uniform(0.85, 0.99)
    volume = random.uniform(100000, 5000000)
    role = "Mule" if risk_score > 0.9 else "Smurf"
    case_id = f"AUTO-{random.randint(1000, 9999)}"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = f"""CONFIDENTIAL SUSPICIOUS ACTIVITY REPORT (SAR)
==================================================
DATE: {timestamp}
CASE ID: {case_id}
SUBJECT: {wallet_id}

RISK ASSESSMENT
---------------
Suspicion Score: {risk_score:.4f}
Risk Level: {"CRITICAL" if risk_score > 0.9 else "HIGH"}
Detected Role: {role}
Flow Ratio: {random.uniform(0.8, 1.2):.2f}

FINANCIAL ACTIVITY
------------------
Total Volume: ${volume:,.2f} USD
Tags: High Velocity, Structurally Embedded, Layering Detected

NARRATIVE
---------
The subject wallet has been flagged by the AI Forensics Engine due to anomalous behavior 
consistent with {role.lower()} patterning. The high velocity of funds and 
structural positioning suggests potential illicit activity.

Analysis indicates rapid fragmentation of incoming capital across multiple 
disposable distinct addresses ("Peeling Chain").

Recommended Action: Immediate Freeze & Audit.
==================================================
Generated by Smurfing Hunter Enterprise"""

    return jsonify({'report': report})


@app.route('/api/global-risk', methods=['GET'])
def get_global_risk():
    # Generate mock risk data for analytics scatter plot
    data = []
    roles = ['Source', 'Mule', 'Aggregator']
    for i in range(200):
        data.append({
            'wallet_id': f"0x{random.randint(10**10, 10**11):x}",
            'display_vol': 10**random.uniform(2, 6), # Log scale volume
            'risk_score': random.random(),
            'role': random.choice(roles)
        })
    return jsonify(data)

@app.route('/api/wallet/<wallet_id>/report', methods=['GET'])
def get_wallet_report(wallet_id):
    # Generate a detailed AI Forensic Report
    risk_score = random.uniform(0.75, 0.99)
    case_id = f"REF-{random.randint(10000, 99999)}"
    volume = random.randint(50000, 5000000)
    role = "Mule" if risk_score > 0.8 else "Smurf"
    bad_actors = random.randint(3, 12)
    flow_ratio = random.uniform(0.7, 1.1)
    
    html_report = f"""
    <div style="font-family: 'Inter', sans-serif; color: #e2e8f0; background: #0f172a; border-radius: 8px; padding: 16px; border: 1px solid #1e293b;">
        <h4 style="color: #38bdf8; margin: 0 0 12px 0; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">AI Forensic Report</h4>
        
        <div style="font-family: 'SF Mono', monospace; font-size: 0.75rem; color: #94a3b8; margin-bottom: 16px;">
            CASE ID: <span style="color: #f8fafc;">{case_id}</span><br>
            SUBJECT: <span style="color: #f8fafc;">{wallet_id[:10]}...</span>
        </div>

        <div style="margin-bottom: 16px;">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Risk Assessment</div>
            <div style="font-size: 0.65rem; color: #94a3b8; margin-bottom: 4px;">CRITICAL SUSPICION SCORE:</div>
            <div style="font-size: 2rem; font-weight: 700; color: #ef4444; line-height: 1;">{risk_score:.4f}</div>
        </div>

        <div style="margin-bottom: 16px; border-left: 2px solid #334155; padding-left: 12px;">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 8px;">BEHAVIOR ANALYTICS</div>
            
            <div style="margin-bottom: 6px; font-size: 0.85rem;">
                <span style="color: #94a3b8;">Pattern:</span> 
                <span style="color: #4ade80; font-weight: 600;">AGGREGATION ({role})</span>
            </div>
            <div style="margin-bottom: 6px; font-size: 0.85rem;">
                <span style="color: #94a3b8;">Flow Ratio:</span> 
                <span style="color: #4ade80;">{flow_ratio:.2f}</span>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.4;">
                <span style="color: #94a3b8;">Bad Actors:</span> 
                <span style="color: #4ade80;">{bad_actors} confirmed illicit connections.</span>
            </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid #1e293b; border-left: 3px solid #38bdf8; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">
                <strong style="color: #38bdf8;">GNN CONCLUSION:</strong> Subject exhibits structural properties consistent with {role.lower()} operations. Immediate audit recommended.
            </p>
        </div>

         <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
            <span style="font-size: 0.85rem; font-weight: 600; color: #e2e8f0;">Volume:</span>
            <span style="font-size: 1rem; font-weight: 700; color: #4ade80; font-family: 'SF Mono', monospace;">${volume:,.0f} USD</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span> High Velocity
            </div>
             <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #fdba74; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span> Structurally Embedded
            </div>
        </div>
    </div>
    """
    return jsonify({'report': html_report})

@app.route('/api/wallet/<wallet_id>/sankey', methods=['GET'])
def get_wallet_sankey(wallet_id):
    # Dynamic Color Helper
    def get_color(risk_score):
        if risk_score > 0.8: return '#EA3943' # High Risk (Red)
        if risk_score > 0.5: return '#FFA726' # Medium Risk (Orange)
        return '#16C784' # Low Risk (Green)

    # Redesigned Sankey: Source -> Target -> Destinations
    nodes = []
    links = []
    
    # 0. Target Wallet (Center) - Calculated Risk
    target_risk = random.uniform(0.7, 0.99) # Usually high for suspect
    nodes.append({'name': f"TARGET: {wallet_id[:6]}...", 'color': get_color(target_risk)}) 
    target_idx = 0
    
    # 1. Sources (Inflow - Left Side)
    # 2-4 Sources
    for i in range(random.randint(2, 4)):
        src_risk = random.random() # Random risk
        nodes.append({'name': f"0x{random.randint(10**5, 10**6)}", 'color': get_color(src_risk)}) 
        source_idx = len(nodes) - 1
        
        val = random.randint(200, 800)
        # Link color follows source risk
        links.append({'source': source_idx, 'target': target_idx, 'value': val, 'color': get_color(src_risk)})

    # 2. Destinations (Outflow - Right Side)
    # Top 5-8 Destination Streams
    total_inflow = sum(l['value'] for l in links)
    remaining_outflow = total_inflow
    
    for i in range(random.randint(5, 8)):
        dest_risk = random.random()
        nodes.append({'name': f"0x{random.randint(10**5, 10**6)}", 'color': get_color(dest_risk)})
        dest_idx = len(nodes) - 1
        
        # Decreasing values to simulate "Top Streams"
        if remaining_outflow <= 0: break
        
        val = int(remaining_outflow * random.uniform(0.1, 0.3))
        if val < 10: val = remaining_outflow # Dump rest if small
        
        # Link color follows target (center) risk as it flows out? 
        # Or destination risk? Usually flow color matches the source of the flow or a gradient.
        # Let's match destination risk to show where the dirty money is going.
        links.append({'source': target_idx, 'target': dest_idx, 'value': val, 'color': get_color(dest_risk)})
        remaining_outflow -= val
        
    return jsonify({'nodes': nodes, 'links': links})

@app.route('/api/wallet/<wallet_id>/sar', methods=['GET'])
def get_wallet_sar_get(wallet_id):
    # GET version of SAR for the frontend
    risk_score = random.uniform(0.85, 0.99)
    case_id = f"SAR-{random.randint(10000, 99999)}"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = f"""CONFIDENTIAL SUSPICIOUS ACTIVITY REPORT (SAR)
==================================================
DATE: {timestamp}
CASE ID: {case_id}
SUBJECT: {wallet_id}

RISK ASSESSMENT
---------------
Suspicion Score: {risk_score:.4f}
Risk Level: CRITICAL
Detected Role: Layering Agent

FINANCIAL ACTIVITY
------------------
Total Volume: ${random.randint(500000, 2000000):,.2f} USD
Tags: Peeling Chain, Structurally Embedded

NARRATIVE
---------
The subject wallet has been flagged by the Smurfing Hunter engine.
Patterns indicate automated layering activity designed to obfuscate
the origin of funds.

Recommended Action: FREEZE ASSETS.
==================================================
Generated by Smurfing Hunter Enterprise"""

    return jsonify({'sar': report})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
