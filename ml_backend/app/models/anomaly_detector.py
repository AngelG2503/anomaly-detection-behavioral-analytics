import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime

class AnomalyDetector:
    def __init__(self):
        self.network_detector = None
        self.email_detector = None
        self.threat_classifier = None
        self.scaler_network = StandardScaler()
        self.scaler_email = StandardScaler()
        
    def train_network_detector(self, X_train):
        """
        Train Isolation Forest for network anomaly detection
        X_train: numpy array of network features
        """
        # Scale features
        X_scaled = self.scaler_network.fit_transform(X_train)
        
        # Train Isolation Forest
        self.network_detector = IsolationForest(
            contamination=0.1,  # Expected proportion of outliers
            random_state=42,
            n_estimators=100
        )
        self.network_detector.fit(X_scaled)
        print("Network anomaly detector trained successfully")
        
    def train_email_detector(self, X_train):
        """
        Train Isolation Forest for email anomaly detection
        X_train: numpy array of email features
        """
        # Scale features
        X_scaled = self.scaler_email.fit_transform(X_train)
        
        # Train Isolation Forest
        self.email_detector = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.email_detector.fit(X_scaled)
        print("Email anomaly detector trained successfully")
        
    def train_threat_classifier(self, X_train, y_train):
        """
        Train Random Forest classifier for threat classification
        X_train: numpy array of features
        y_train: threat labels (e.g., 'phishing', 'data_leakage', 'unauthorized_access', 'normal')
        """
        # Train Random Forest Classifier
        self.threat_classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.threat_classifier.fit(X_train, y_train)
        print("Threat classifier trained successfully")
        
    def predict_network_anomaly(self, features):
        """
        Predict if network traffic is anomalous
        features: numpy array of network features
        Returns: (is_anomaly, anomaly_score)
        """
        if self.network_detector is None:
            raise ValueError("Network detector not trained yet")
            
        # Scale features
        features_scaled = self.scaler_network.transform(features.reshape(1, -1))
        
        # Predict (-1 = anomaly, 1 = normal)
        prediction = self.network_detector.predict(features_scaled)[0]
        
        # Get anomaly score (lower = more anomalous)
        score = self.network_detector.score_samples(features_scaled)[0]
        
        # Convert to probability-like score (0 to 1, higher = more anomalous)
        anomaly_score = 1 / (1 + np.exp(score))
        
        is_anomaly = prediction == -1
        
        return is_anomaly, float(anomaly_score)
        
    def predict_email_anomaly(self, features):
        """
        Predict if email is anomalous
        features: numpy array of email features
        Returns: (is_anomaly, anomaly_score)
        """
        if self.email_detector is None:
            raise ValueError("Email detector not trained yet")
            
        # Scale features
        features_scaled = self.scaler_email.transform(features.reshape(1, -1))
        
        # Predict
        prediction = self.email_detector.predict(features_scaled)[0]
        score = self.email_detector.score_samples(features_scaled)[0]
        
        anomaly_score = 1 / (1 + np.exp(score))
        is_anomaly = prediction == -1
        
        return is_anomaly, float(anomaly_score)
        
    def classify_threat(self, features):
        """
        Classify the type of threat
        features: numpy array
        Returns: (threat_class, confidence)
        """
        if self.threat_classifier is None:
            raise ValueError("Threat classifier not trained yet")
            
        prediction = self.threat_classifier.predict(features.reshape(1, -1))[0]
        probabilities = self.threat_classifier.predict_proba(features.reshape(1, -1))[0]
        confidence = float(max(probabilities))
        
        return prediction, confidence
        
    def save_models(self, path='app/models/saved_models/'):
        """Save trained models to disk"""
        os.makedirs(path, exist_ok=True)
        
        if self.network_detector:
            joblib.dump(self.network_detector, f'{path}network_detector.pkl')
            joblib.dump(self.scaler_network, f'{path}scaler_network.pkl')
            
        if self.email_detector:
            joblib.dump(self.email_detector, f'{path}email_detector.pkl')
            joblib.dump(self.scaler_email, f'{path}scaler_email.pkl')
            
        if self.threat_classifier:
            joblib.dump(self.threat_classifier, f'{path}threat_classifier.pkl')
            
        print(f"Models saved to {path}")
        
    def load_models(self, path='app/models/saved_models/'):
        """Load trained models from disk"""
        try:
            self.network_detector = joblib.load(f'{path}network_detector.pkl')
            self.scaler_network = joblib.load(f'{path}scaler_network.pkl')
            print("Network detector loaded")
        except:
            print("Network detector not found")
            
        try:
            self.email_detector = joblib.load(f'{path}email_detector.pkl')
            self.scaler_email = joblib.load(f'{path}scaler_email.pkl')
            print("Email detector loaded")
        except:
            print("Email detector not found")
            
        try:
            self.threat_classifier = joblib.load(f'{path}threat_classifier.pkl')
            print("Threat classifier loaded")
        except:
            print("Threat classifier not found")
