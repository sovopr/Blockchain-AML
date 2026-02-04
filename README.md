
# 🕵️‍♂️ Smurfing Hunter - Blockchain AML Intelligence Platform

**An AI-powered forensic tool for detecting "Smurfing" (structuring) money laundering patterns in blockchain transaction networks using Graph Neural Networks (GNN).**

---

## 🚀 Overview

Smurfing Hunter is a specialized Anti-Money Laundering (AML) platform designed to visualize and detect illicit financial flows. It combines a **Flask backend** running a **PyTorch Geometric GNN** with a high-performance **D3.js frontend** to identify complex laundering structures like "Peeling Chains," "Fan-out/Fan-in," and Mule accounts.

### ✨ Key Features

* **🕸️ Interactive Network Graph:** Visualize transaction flows, identify mules, and trace funds using a force-directed graph (D3.js).
* **🧠 GNN Anomaly Detection:** Uses Graph Convolutional Networks (GCN) to classify wallets as 'Safe', 'Smurf', or 'Mule' based on transactional topology.
* **🎨 Dual-Theme UI:**
    * **Pastel Mode:** A clean, Vercel-inspired light theme for professional reporting.
    * **Crypto Mode:** A dark, high-contrast dashboard inspired by crypto exchanges.
* **📄 Automated SAR Generation:** Instantly generate confidental **Suspicious Activity Reports (SAR)** for flagged wallets.
* **🌊 Sankey Flow Analysis:** Trace the exact path of dirty funds from Source → Target → Destination.
* **📊 Real-time Risk Metrics:** Live updates on network health, contagion spikes, and high-risk clusters.

---

## 🛠️ Tech Stack

### **Backend**
* **Framework:** Flask (Python)
* **AI/ML:** PyTorch, PyTorch Geometric (GNN)
* **Data Handling:** NumPy, Pandas

### **Frontend**
* **Core:** HTML5, CSS3, Vanilla JavaScript
* **Visualization:** D3.js (v7), PapaParse
* **Design:** CSS Variables for dynamic theming (Pastel/Dark)

---

## 📂 Project Structure

```bash
smurfing-hunter/
├── backend/
│   ├── api_server.py          # Main Flask API entry point
│   ├── models/
│   │   ├── gnn_model.py       # PyTorch Geometric GNN architecture
│   │   └── preprocessing.py   # Data formatting for the model
│   ├── requirements.txt       # Python dependencies
│   └── weights/               # Pre-trained model weights (.pth)
│
├── frontend1/                 # Frontend Static Files
│   ├── index.html             # Landing Page (Pastel Default)
│   ├── index-platform.html    # Main Dashboard
│   ├── css/                   # Theme styles (pastel-theme.css, crypto-theme.css)
│   ├── js/                    # D3.js logic, graph renderers, data processors
│   └── data/                  # CSV datasets (transactions, predictions)
│
└── README.md

```

---

## ⚡ Quick Start

### 1. Backend Setup

The backend serves the API and also hosts the static frontend files.

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the Flask Server
python api_server.py

```

> **Note:** If `torch_geometric` is not installed or configured, the system will automatically degrade to **Mock Mode**, generating synthetic risk data for demonstration purposes.

### 2. Access the Application

Once the server is running, open your browser:

* **Landing Page:** [http://localhost:5000/](https://www.google.com/search?q=http://localhost:5000/)
* **Platform Dashboard:** [http://localhost:5000/index-platform.html](https://www.google.com/search?q=http://localhost:5000/index-platform.html)

---

## 🎨 Themes & Customization

The platform comes with two pre-built themes. You can switch between them by editing the `<link>` tag in the HTML files or using the backup files provided.

| Theme | Description | File |
| --- | --- | --- |
| **Vercel Pastel** | Clean, white/off-white background with soft purple accents. Ideal for printing reports. | `css/pastel-theme.css` |
| **Crypto Dark** | Navy/Dark background with neon accents. Ideal for NOCs and dark-mode users. | `css/crypto-theme.css` |

---

## 🔌 API Endpoints

The Flask server exposes several endpoints for the frontend visualization:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/network/graph` | Returns nodes and links for the ego-graph of a specific target. |
| `GET` | `/api/flow` | Returns Sankey diagram data (Source → Target → Destination). |
| `GET` | `/api/anomalies` | Returns the top 50 high-risk wallets identified by the GNN. |
| `GET` | `/api/sar/generate` | Generates a text-based Suspicious Activity Report. |
| `GET` | `/api/wallet/<id>/report` | Generates a detailed HTML forensic report for a wallet. |

---

## 🧪 Model Details

The core detection engine is a **Graph Neural Network (GNN)** defined in `backend/models/gnn_model.py`.

* **Architecture:** 3-Layer GCN (Graph Convolutional Network).
* **Input:** Node features (Transaction volume, frequency, neighbor diversity).
* **Output:** Binary Classification (0: Safe, 1: Suspicious) or Multi-class (Safe, Smurf, Mule).
* **Fallback:** If model weights (`model_weights.pth`) are missing, the system uses a sophisticated probabilistic mock generator for demos.
## 👨🏻‍💻 Website !
[Smurfing Hunter](https://surfing-hunter.onrender.com)
