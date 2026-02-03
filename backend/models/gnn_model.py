import torch
import torch.nn as nn
# Check for geometric availability, mock if missing (for dev environment without full PyG support)
try:
    from torch_geometric.nn import GCNConv, global_mean_pool
    from torch_geometric.data import Data
    PYG_AVAILABLE = True
except ImportError:
    PYG_AVAILABLE = False
    # Mock classes
    class GCNConv(nn.Module):
        def __init__(self, in_c, out_c): super().__init__()
        def forward(self, x, ei): return x
    def global_mean_pool(x, batch): return x.mean(dim=0)

import numpy as np
import os

class SmurfingDetectorGNN(nn.Module):
    """
    Your GNN model for detecting smurfing patterns
    """
    def __init__(self, num_features, hidden_dim=64, num_classes=2):
        super(SmurfingDetectorGNN, self).__init__()
        self.conv1 = GCNConv(num_features, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, hidden_dim)
        self.conv3 = GCNConv(hidden_dim, hidden_dim)
        self.fc = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x, edge_index, batch):
        # GCN layers
        x = torch.relu(self.conv1(x, edge_index))
        x = torch.relu(self.conv2(x, edge_index))
        x = torch.relu(self.conv3(x, edge_index))
        
        # Global pooling
        # Handle batch=None for single graph inference
        if batch is None:
            batch = torch.zeros(x.size(0), dtype=torch.long, device=x.device)
            
        x = global_mean_pool(x, batch)
        
        # Classification
        x = self.fc(x)
        return x

class ModelManager:
    """
    Manages model loading and predictions
    """
    def __init__(self, model_path='models/weights/model_weights.pth'):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.mock_mode = False
        
        # Check if weights exist
        if not os.path.exists(model_path):
            print(f"⚠️ Warning: Model weights not found at {model_path}. Running in MOCK MODE.")
            self.mock_mode = True
            return

        # Initialize real model
        self.model = SmurfingDetectorGNN(num_features=10) # Adjust num_features as needed
        try:
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
        except Exception as e:
            print(f"⚠️ Error loading model: {e}. Switching to MOCK MODE.")
            self.mock_mode = True
    
    def predict(self, graph_data):
        """
        Run prediction on graph data
        
        Args:
            graph_data: PyTorch Geometric Data object or Dict
            
        Returns:
            predictions: Dict with anomaly predictions and scores
        """
        if self.mock_mode:
            return self._mock_predict(graph_data)

        with torch.no_grad():
            graph_data = graph_data.to(self.device)
            output = self.model(
                graph_data.x, 
                graph_data.edge_index, 
                getattr(graph_data, 'batch', None)
            )
            probabilities = torch.softmax(output, dim=1)
            predictions = torch.argmax(probabilities, dim=1)
            
        return {
            'predictions': predictions.cpu().numpy(),
            'probabilities': probabilities.cpu().numpy(),
            'is_anomaly': predictions.cpu().numpy() == 1
        }
    
    def _mock_predict(self, graph_data):
        """Fallback prediction for testing without trained model."""
        import random
        # Assume graph_data is a dict or object with 'x' (features)
        num_nodes = len(graph_data.x) if hasattr(graph_data, 'x') else 10
        
        # Generate fake probabilities (mostly normal, some anomalies)
        probs = []
        is_anomaly = []
        preds = []
        
        for _ in range(num_nodes):
            risk = random.random()
            if risk > 0.85:
                probs.append([1-risk, risk])
                is_anomaly.append(True)
                preds.append(1)
            else:
                probs.append([1-risk, risk])
                is_anomaly.append(False)
                preds.append(0)
                
        return {
            'predictions': np.array(preds),
            'probabilities': np.array(probs),
            'is_anomaly': np.array(is_anomaly)
        }

    def get_node_embeddings(self, graph_data):
        """
        Get node embeddings for visualization
        """
        if self.mock_mode:
            # Return random embeddings
            num_nodes = len(graph_data.x) if hasattr(graph_data, 'x') else 10
            return np.random.rand(num_nodes, 64)

        with torch.no_grad():
            graph_data = graph_data.to(self.device)
            x = torch.relu(self.model.conv1(graph_data.x, graph_data.edge_index))
            x = torch.relu(self.model.conv2(x, graph_data.edge_index))
            embeddings = torch.relu(self.model.conv3(x, graph_data.edge_index))
        
        return embeddings.cpu().numpy()
