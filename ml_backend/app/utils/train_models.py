import numpy as np
import pandas as pd
from app.models.anomaly_detector import AnomalyDetector

def generate_sample_data():
    """
    Generate sample training data for demonstration
    In production, you'll use real data
    """
    np.random.seed(42)
    
    # Generate normal network traffic data
    n_samples = 1000
    network_data = np.random.randn(n_samples, 11)  # 11 features
    
    # Generate normal email data
    email_data = np.random.randn(n_samples, 11)  # 11 features
    
    # Generate threat classification data
    threat_features = np.random.randn(n_samples, 11)
    threat_labels = np.random.choice(
        ['normal', 'phishing', 'data_leakage', 'unauthorized_access'], 
        size=n_samples
    )
    
    return network_data, email_data, threat_features, threat_labels

def train_all_models():
    """Train all ML models"""
    print("Starting model training...")
    
    # Generate sample data
    network_data, email_data, threat_features, threat_labels = generate_sample_data()
    
    # Initialize detector
    detector = AnomalyDetector()
    
    # Train models
    print("\n1. Training network anomaly detector...")
    detector.train_network_detector(network_data)
    
    print("\n2. Training email anomaly detector...")
    detector.train_email_detector(email_data)
    
    print("\n3. Training threat classifier...")
    detector.train_threat_classifier(threat_features, threat_labels)
    
    # Save models
    print("\n4. Saving models...")
    detector.save_models()
    
    print("\n✅ All models trained and saved successfully!")
    
    return detector

if __name__ == "__main__":
    train_all_models()
