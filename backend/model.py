import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

class AnomalyModel:
    def __init__(self, model_path: str = "backend/anomaly_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.threshold = -0.1  # default decision threshold
        self.load()

    # ---------------------------
    # Feature Extraction
    # ---------------------------
    def features_from_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert raw traffic records into numeric features usable by ML model.
        Expects columns: src_ip, dst_ip, bytes, packets, protocol
        """
        features = pd.DataFrame()
        features["bytes"] = df["bytes"]
        features["packets"] = df["packets"]

        # Average packet size
        features["avg_pkt_size"] = df["bytes"] / (df["packets"] + 1e-6)

        # Protocol encoding: map TCP=6, UDP=17, else 0
        proto_map = {"TCP": 6, "UDP": 17}
        features["proto"] = df["protocol"].map(proto_map).fillna(0)

        return features

    # ---------------------------
    # Model Training
    # ---------------------------
    def fit(self, X: pd.DataFrame):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        self.model.fit(X)

    def save(self):
        if self.model is not None:
            joblib.dump(self.model, self.model_path)

    def load(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)

    # ---------------------------
    # Prediction
    # ---------------------------
    def score(self, X: pd.DataFrame):
        if self.model is None:
            raise ValueError("Model not trained yet")
        return self.model.decision_function(X).tolist()

    def is_anomaly(self, X: pd.DataFrame):
        if self.model is None:
            raise ValueError("Model not trained yet")
        preds = self.model.predict(X)  # -1 = anomaly, 1 = normal
        return [p == -1 for p in preds]
