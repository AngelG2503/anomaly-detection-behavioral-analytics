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
        self.network_threat_classifier = None  # ✅ SEPARATE classifier for network
        self.email_threat_classifier = None    # ✅ SEPARATE classifier for email
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

    def train_network_threat_classifier(self, X_train, y_train):
        """
        Train Random Forest classifier for NETWORK threat classification
        y_train: threat labels like 'ddos', 'port_scan', 'dos', 'normal'
        """
        self.network_threat_classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.network_threat_classifier.fit(X_train, y_train)
        print("Network threat classifier trained successfully")

    def train_email_threat_classifier(self, X_train, y_train):
        """
        Train Random Forest classifier for EMAIL threat classification
        y_train: threat labels like 'phishing', 'spam', 'data_leakage', 'malware', 'normal'
        """
        self.email_threat_classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.email_threat_classifier.fit(X_train, y_train)
        print("Email threat classifier trained successfully")

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

    def classify_network_threat(self, features):
        """
        Classify NETWORK threat type
        Returns: (threat_class, confidence)
        """
        if self.network_threat_classifier is None:
            # Fallback: Rule-based classification for network
            return self._classify_network_threat_fallback(features)

        prediction = self.network_threat_classifier.predict(features.reshape(1, -1))[0]
        probabilities = self.network_threat_classifier.predict_proba(features.reshape(1, -1))[0]
        confidence = float(max(probabilities))

        return prediction, confidence

    def classify_email_threat(self, features):
        """
        Classify EMAIL threat type
        Returns: (threat_class, confidence)
        """
        if self.email_threat_classifier is None:
            # Fallback: Rule-based classification for email
            return self._classify_email_threat_fallback(features)

        prediction = self.email_threat_classifier.predict(features.reshape(1, -1))[0]
        probabilities = self.email_threat_classifier.predict_proba(features.reshape(1, -1))[0]
        confidence = float(max(probabilities))

        return prediction, confidence

    def _classify_network_threat_fallback(self, features):
        """
        Rule-based network threat classification when ML model not available
        features indices: [packet_size, duration, port, packets_sent, packets_received, bytes_sent, bytes_received, hour, weekday, is_tcp, is_udp]
        """
        packets_sent = features[3]
        packets_received = features[4]
        bytes_sent = features[5]
        port = features[2]
        
        # DDoS: High packet rate, low response
        if packets_sent > 500 and packets_received < 100:
            return 'ddos', 0.85
        
        # Port Scan: Unusual ports
        if port < 1024 and port not in [80, 443, 22, 21]:
            return 'port_scan', 0.75
        
        # Data Exfiltration: High bytes sent
        if bytes_sent > 100000:
            return 'data_exfiltration', 0.80
        
        return 'suspicious', 0.70

    def _classify_email_threat_fallback(self, features):
        """
        Rule-based email threat classification when ML model not available
        features indices: [num_recipients, email_size, has_attachment, num_attachments, subject_length, body_length, is_reply, is_forward, hour, weekday, domain_length]
        """
        num_recipients = features[0]
        email_size = features[1]
        has_attachment = features[2]
        num_attachments = features[3]
        subject_length = features[4]
        body_length = features[5]
        
        # Phishing: Short subject, has attachment, single recipient
        if subject_length < 30 and has_attachment and num_recipients == 1:
            return 'phishing', 0.80
        
        # Spam: Many recipients
        if num_recipients > 50:
            return 'spam', 0.85
        
        # Data Leakage: Large email with multiple attachments
        if email_size > 10000 and num_attachments > 3:
            return 'data_leakage', 0.90
        
        # Malware: Has attachments, suspicious size
        if num_attachments > 0 and email_size < 500:
            return 'malware', 0.75
        
        return 'suspicious_email', 0.70

    def save_models(self, path='app/models/saved_models/'):
        """Save trained models to disk"""
        os.makedirs(path, exist_ok=True)

        if self.network_detector:
            joblib.dump(self.network_detector, f'{path}network_detector.pkl')
            joblib.dump(self.scaler_network, f'{path}scaler_network.pkl')

        if self.email_detector:
            joblib.dump(self.email_detector, f'{path}email_detector.pkl')
            joblib.dump(self.scaler_email, f'{path}scaler_email.pkl')

        if self.network_threat_classifier:
            joblib.dump(self.network_threat_classifier, f'{path}network_threat_classifier.pkl')

        if self.email_threat_classifier:
            joblib.dump(self.email_threat_classifier, f'{path}email_threat_classifier.pkl')

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
            self.network_threat_classifier = joblib.load(f'{path}network_threat_classifier.pkl')
            print("Network threat classifier loaded")
        except:
            print("Network threat classifier not found - using fallback rules")

        try:
            self.email_threat_classifier = joblib.load(f'{path}email_threat_classifier.pkl')
            print("Email threat classifier loaded")
        except:
            print("Email threat classifier not found - using fallback rules")
