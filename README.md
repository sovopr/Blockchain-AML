# Smurfing Hunter

Blockchain transaction analytics platform for detecting money laundering patterns — specifically structuring (smurfing), peeling chains, fan-out/fan-in dispersal, and mule accounts — in Ethereum-style transaction networks.

Live demo: https://smurfing-hunter.onrender.com

---

## Table of Contents

- [Background](#background)
- [Project Status](#project-status)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Dataset](#dataset)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Frontend Modules](#frontend-modules)
- [GNN Model](#gnn-model)
- [Pattern Detection](#pattern-detection)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)

---

## Background

**Smurfing** (structuring) is a money laundering technique in which large sums are fragmented into many smaller transactions to evade reporting thresholds. In blockchain networks, this manifests as characteristic graph topologies: high fan-out from source wallets, convergence at aggregator addresses, and layered intermediary hops across chains of disposable wallets (peeling chains).

Smurfing Hunter applies graph-based analysis to identify wallets and transaction clusters exhibiting these structural patterns. The backend exposes a REST API consumed by a browser-based investigation dashboard that supports Suspicious Activity Report (SAR) generation.

---

## Project Status

This project is currently in **active development / proof-of-concept stage**. The frontend pattern detection pipeline and visualization layer are fully functional. The GNN model architecture (`SmurfingDetectorGNN`) is implemented and the `ModelManager` wrapper handles graceful degradation, but trained weights are not yet committed and the model inference path is not yet wired to the live API endpoints. All API responses are currently generated from deterministic mock data seeded by wallet address for consistency across requests.

| Component | Status |
|---|---|
| Frontend visualization (D3.js graph, Sankey) | Functional |
| Client-side pattern detection (JavaScript) | Functional |
| Flask REST API | Functional (mock data) |
| GNN model architecture | Implemented |
| GNN training pipeline | Not committed |
| GNN inference integrated into API | Not yet implemented |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Flask API Server                 │
│               backend/api_server.py               │
│                                                   │
│  ┌─────────────────────┐  ┌────────────────────┐  │
│  │    ModelManager     │  │   Static File      │  │
│  │  (mock mode active) │  │   Server           │  │
│  └─────────────────────┘  │   frontend1/       │  │
│                           └────────────────────┘  │
└────────────────────┬─────────────────────────────┘
                     │ HTTP / JSON
        ┌────────────▼──────────────────┐
        │         Browser Client        │
        │                               │
        │  ┌────────────┐  ┌─────────┐  │
        │  │ DataProc-  │  │ Pattern │  │
        │  │ essor.js   │  │ Detect- │  │
        │  │ (CSV load) │  │ or.js   │  │
        │  └─────┬──────┘  └────┬────┘  │
        │        └──────┬───────┘       │
        │        ┌──────▼──────┐        │
        │        │ GraphEngine │        │
        │        │(D3.js force)│        │
        │        └──────┬──────┘        │
        │  ┌────────────▼─────────────┐ │
        │  │   Dashboard / SAR Panel  │ │
        │  └──────────────────────────┘ │
        └───────────────────────────────┘
```

The Flask process serves both the REST API and the frontend static files. No separate build step is required; `frontend1/` is served directly as a static folder.

---

## Project Structure

```
Blockchain-AML/
├── backend/
│   ├── api_server.py              # Flask application; all routes and static serving
│   ├── requirements.txt           # Minimal backend-only dependencies
│   └── models/
│       ├── __init__.py
│       ├── gnn_model.py           # SmurfingDetectorGNN (3-layer GCN) + ModelManager
│       └── preprocessing.py       # Graph construction from raw transaction dicts
│
├── frontend1/
│   ├── index.html                 # Landing page (pastel theme)
│   ├── index-platform.html        # Main investigation dashboard (pastel theme)
│   ├── index-platform-crypto.html # Investigation dashboard (crypto/dark theme)
│   ├── index-landing-crypto.html  # Landing page (crypto/dark theme)
│   ├── analytics.html             # Global risk scatter plot and analytics view
│   ├── threats.html               # Threat feed panel
│   ├── css/
│   │   ├── styles.css             # Base styles
│   │   ├── pastel-theme.css       # Light theme
│   │   └── crypto-theme.css       # Dark theme
│   ├── js/
│   │   ├── data-processor.js      # CSV loading, wallet feature extraction, graph build
│   │   ├── pattern-detector.js    # Client-side AML pattern detection
│   │   ├── graph-engine.js        # Core graph data model and layout engine
│   │   ├── graph-renderer.js      # D3.js force-directed graph (pastel theme)
│   │   ├── graph-renderer-crypto.js  # D3.js force-directed graph (crypto theme)
│   │   ├── main.js                # Dashboard entry point (pastel)
│   │   ├── main-crypto.js         # Dashboard entry point (crypto)
│   │   ├── enhanced-main.js       # Extended main with additional analytics
│   │   ├── dashboard.js           # Metric cards and sidebar logic
│   │   ├── wallet-popup.js        # Wallet detail popup on node click
│   │   ├── explainer.js           # Pattern explainer tooltips
│   │   ├── animation-engine.js    # UI transitions and pulse animations
│   │   ├── particles-bg.js        # Background particle effect (landing pages)
│   │   └── d3-sankey.min.js       # Vendored D3 Sankey plugin
│   └── data/
│       ├── reduced_transactions.csv  # 500 synthetic ETH transactions
│       ├── reduced_labels.csv        # 500 wallet ground-truth labels (0/1)
│       └── reduced_predictions.csv   # 500 GNN output predictions with probabilities
│
├── requirements.txt               # Full deployment dependencies (includes torch)
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| API server | Flask | 3.0.0 |
| CORS | Flask-CORS | 4.0.0 |
| Production server | Gunicorn | 21.2.0 |
| Numerical computation | NumPy | 1.26.4 |
| ML framework | PyTorch (CPU build) | 2.5.1 |
| Graph ML *(optional)* | PyTorch Geometric | install separately |
| Frontend visualization | D3.js | v7 (CDN) |
| CSV parsing | PapaParse | CDN |
| Markup / Styling | HTML5, CSS3, Vanilla JS | — |

**Note on PyTorch Geometric:** `torch_geometric` is an optional dependency not included in `requirements.txt`. If absent, `ModelManager` starts in mock mode automatically. See [GNN Model](#gnn-model) for details.

**Note on Pandas:** `preprocessing.py` imports `pandas` for feature engineering. It is not included in `requirements.txt` and must be installed separately if the preprocessing pipeline is used directly.

---

## Dataset

The `frontend1/data/` directory contains a **synthetic Ethereum-style dataset** of 500 transactions generated to simulate smurfing behaviour. The data is not derived from any real blockchain ledger.

| File | Rows | Columns | Description |
|---|---|---|---|
| `reduced_transactions.csv` | 500 | Source, Target, Amount, Timestamp, Token_Type | Directed transaction ledger (ETH token) |
| `reduced_labels.csv` | 500 | Wallet_ID, Label | Ground-truth binary labels (0 = legitimate, 1 = suspicious) |
| `reduced_predictions.csv` | 500 | Wallet_ID, GNN_Prob, True_Label, Predicted_Class | Pre-computed GNN output for evaluation |

These files are loaded client-side by `data-processor.js` via PapaParse. Pattern detection and graph rendering operate entirely on this local dataset without requiring any backend call.

---

## Installation

**Requirements:** Python 3.10+

```bash
git clone https://github.com/sovopr/Blockchain-AML.git
cd Blockchain-AML
pip install -r requirements.txt
```

**Optional — full GNN inference:**

```bash
pip install torch-geometric
pip install pandas
```

`torch_geometric` installation requires matching your PyTorch and CUDA versions. Refer to the [official installation matrix](https://pytorch-geometric.readthedocs.io/en/latest/install/installation.html).

---

## Running the Application

```bash
cd backend
python api_server.py
```

The Flask development server starts on `http://localhost:5000`.

| URL | Page |
|---|---|
| `http://localhost:5000/` | Landing page (pastel) |
| `http://localhost:5000/index-platform.html` | Investigation dashboard (pastel) |
| `http://localhost:5000/index-platform-crypto.html` | Investigation dashboard (dark) |
| `http://localhost:5000/analytics.html` | Global risk analytics view |

**Production deployment with Gunicorn:**

```bash
gunicorn -w 2 -b 0.0.0.0:5000 api_server:app
```

---

## API Reference

All endpoints return JSON. Request parameters are query strings unless noted.

| Method | Endpoint | Parameters | Description |
|---|---|---|---|
| `GET` | `/api/overview` | — | Summary stats: total transactions, anomaly count, risk score, network health |
| `GET` | `/api/network/stats` | — | Four metric cards: active nodes, high-risk count, avg volume, GNN accuracy |
| `GET` | `/api/network/graph` | `center` (wallet address) | Ego-graph for the given wallet. Returns `nodes[]` and `links[]` for D3 force layout. Seeded by `center` for determinism. |
| `GET` | `/api/flow` | `center` (wallet address) | Sankey flow data (sources → target → mules). Seeded by `center`. |
| `GET` | `/api/anomalies` | — | List of 100 highest-risk wallets with role, toxicity score, pattern tag, and volume |
| `GET` | `/api/contagion` | — | Time-series of new wallet activations over a 24-hour window (15-minute buckets) |
| `GET` | `/api/risk-map` | — | Scatter plot dataset: 2,150 wallets with volume, risk score, and cluster group |
| `GET` | `/api/global-risk` | — | 200-wallet scatter dataset with role classification (Source / Mule / Aggregator) |
| `POST` | `/api/sar/generate` | `{ "walletId": "<address>" }` (JSON body) | Plain-text SAR report for the specified wallet |
| `GET` | `/api/wallet/<id>/report` | — | HTML-formatted forensic report for wallet `<id>` |
| `GET` | `/api/wallet/<id>/sankey` | — | Wallet-specific Sankey: inflow sources and outflow destinations with risk colouring |
| `GET` | `/api/wallet/<id>/sar` | — | Plain-text SAR for wallet `<id>` (GET equivalent of `POST /api/sar/generate`) |
| `POST` | `/api/predict` | — | Stub endpoint; returns an empty anomalies list. Placeholder for GNN integration. |

All data returned by these endpoints is currently mock. Outputs from `/api/network/graph` and `/api/flow` are deterministic per `center` value (seeded via `random.seed(center)`); all other endpoints return randomly generated values per request.

---

## Frontend Modules

The client-side JavaScript is organised into single-responsibility modules:

**Data layer**

`data-processor.js` — Loads the three CSV files via PapaParse, maps unique addresses to node objects, and computes per-wallet features: transaction count, total volume, in-degree, out-degree, average transaction amount, and fan-out/fan-in counts. This is the data source for both the pattern detector and the graph engine.

**Detection layer**

`pattern-detector.js` — Runs five structural pattern checks against the wallet feature set. See [Pattern Detection](#pattern-detection).

**Rendering layer**

`graph-engine.js` — Manages the graph data model: node/edge sets, layout parameters, selection state, and filtering.

`graph-renderer.js` / `graph-renderer-crypto.js` — D3.js force-directed simulation with zoom, pan, node drag, and click-to-select. Node colour encodes risk classification; edge width encodes transaction volume.

`main.js` / `main-crypto.js` — Entry points that wire together `DataProcessor`, `PatternDetector`, `GraphEngine`, and `GraphRenderer` for each theme variant.

**UI layer**

`dashboard.js` — Populates metric cards and the high-risk wallet sidebar from API responses.

`wallet-popup.js` — On-click wallet detail panel showing features, risk score, and SAR generation trigger.

`explainer.js` — Tooltip overlays that describe which AML pattern flagged a given wallet.

---

## GNN Model

The model is defined in `backend/models/gnn_model.py`.

**Architecture: `SmurfingDetectorGNN`**

Three-layer Graph Convolutional Network using `GCNConv` from PyTorch Geometric, followed by global mean pooling and a linear classification head.

```
Input node features → GCNConv(in, 64) → ReLU
                    → GCNConv(64, 64)  → ReLU
                    → GCNConv(64, 64)  → ReLU
                    → GlobalMeanPool
                    → Linear(64, num_classes)
```

**Node features (as implemented in `preprocessing.py`):**

| Feature | Description |
|---|---|
| `count` | Total transactions involving this address |
| `volume` | Net signed volume (positive = net receiver, negative = net sender) |

`preprocess_transaction_data()` accepts a list of transaction dicts (`from`, `to`, `amount`) and returns a `torch_geometric.data.Data` object with feature matrix `x` and edge index constructed from the transaction graph.

**Output classes:**

`0` — Legitimate  
`1` — Suspicious (smurfing or layering pattern)

**`ModelManager`**

Wraps model loading, inference, and fallback behaviour. On initialisation it checks for weights at `models/weights/model_weights.pth`. If the file is absent or `torch_geometric` is not installed, it switches to mock mode automatically. In mock mode, `predict()` returns probabilistic scores without running the network. The `get_node_embeddings()` method returns the intermediate GCN representations and can be used for downstream visualisation once real weights are available.

No pre-trained weights are distributed with this repository.

---

## Pattern Detection

`pattern-detector.js` implements five client-side heuristic detectors operating on the wallet feature set built by `DataProcessor`:

| Pattern | Detection logic | Default threshold |
|---|---|---|
| **Fan-Out** | Wallets with outgoing edge count above threshold | `fan_out_count ≥ 10` |
| **Fan-In** | Wallets with incoming edge count above threshold | `fan_in_count ≥ 10` |
| **Peeling Chain** | Linear single-input single-output hop sequences above minimum length | chain length ≥ 3 |
| **Fixed Delay Coordination** | Transaction groups with near-identical inter-arrival times | tolerance ≤ 5 seconds |
| **Seed Expansion** | Single-source wallets funding many distinct first-hop recipients | configurable |

Thresholds are properties on the `PatternDetector` instance (`this.thresholds`) and can be adjusted at runtime without modifying source.

---

## Known Limitations

- **All API responses are mock data.** The GNN inference path is not yet connected to any live API endpoint. Risk scores, anomaly lists, and SAR outputs are randomly generated per request (except graph/flow endpoints which are seeded by wallet address).
- **No model weights are included.** There is no training script in the repository. Running real GNN inference requires training `SmurfingDetectorGNN` and saving weights to `backend/models/weights/model_weights.pth`.
---

## Contributing

Issues and pull requests are welcome. Priority areas:

- Wiring `ModelManager.predict()` to the API endpoints and replacing mock responses with real inference output
- Adding a training script for `SmurfingDetectorGNN` against the included dataset
- Pinning `torch_geometric` and `pandas` in `requirements.txt` with compatible version constraints
- Adding request parameter validation and basic authentication middleware

For Python changes, run `ruff check backend/` before submitting. For new API endpoints, update the [API Reference](#api-reference) table in this README.
