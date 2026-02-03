import torch
try:
    from torch_geometric.data import Data
except ImportError:
    # Mock Data class
    class Data:
        def __init__(self, x, edge_index):
            self.x = x
            self.edge_index = edge_index

import pandas as pd
import numpy as np

def preprocess_transaction_data(transactions):
    """
    Convert transaction data to PyTorch Geometric graph
    
    Args:
        transactions: List of transaction dictionaries
        
    Returns:
        Data: PyTorch Geometric Data object
    """
    # Build node features
    node_features = []
    edge_index = []
    
    # Extract features from transactions
    # Note: In a real scenario, we'd need to map addresses to indices first
    # This is a simplified implementation assuming 'transactions' represent nodes for now, 
    # OR we map unique addresses to nodes.
    
    # Mapping addresses to indices
    addresses = set()
    for tx in transactions:
        addresses.add(tx.get('from', ''))
        addresses.add(tx.get('to', ''))
    
    addr_to_idx = {addr: i for i, addr in enumerate(list(addresses)) if addr}
    
    # Features per node (address)
    # Aggregating features for each address
    node_stats = {addr: {'count': 0, 'volume': 0} for addr in addresses if addr}
    for tx in transactions:
        src = tx.get('from')
        dst = tx.get('to')
        amt = float(tx.get('amount', 0))
        
        if src in node_stats:
            node_stats[src]['count'] += 1
            node_stats[src]['volume'] -= amt # Outgoing
        if dst in node_stats:
            node_stats[dst]['count'] += 1
            node_stats[dst]['volume'] += amt # Incoming

    # Create feature matrix X
    # dim=2: [count, volume]
    sorted_addrs = sorted(list(addr_to_idx.keys()), key=lambda k: addr_to_idx[k])
    for addr in sorted_addrs:
        features = [
            float(node_stats[addr]['count']), 
            float(node_stats[addr]['volume'])
        ]
        node_features.append(features)
    
    # Build edge connections
    for tx in transactions:
        src = tx.get('from')
        dst = tx.get('to')
        if src in addr_to_idx and dst in addr_to_idx:
            edge_index.append([addr_to_idx[src], addr_to_idx[dst]])
    
    # Convert to tensors
    x = torch.tensor(node_features, dtype=torch.float)
    edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
    
    # Create PyG Data object
    data = Data(x=x, edge_index=edge_index)
    
    # Attach Metadata for later use
    data.addresses = sorted_addrs
    
    return data

def classify_anomaly_type(transaction):
    """
    Classify the type of anomaly detected
    """
    # Implement classification logic based on patterns
    # Simplified mock logic
    amt = float(transaction.get('amount', 0))
    
    if amt < 1.0:
        return 'Smurfing Pattern'
    elif amt > 50.0:
        return 'Layering'
    else:
        return 'Unusual Pattern'
