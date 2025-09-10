from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from backend.model import AnomalyModel

import pandas as pd
import os
from datetime import datetime

# ---------- App Setup ----------
app = FastAPI(
    title="Net Anomaly API",
    version="0.4.0",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1}
)

model = AnomalyModel()

# Ensure logs folder exists
os.makedirs("logs", exist_ok=True)
LOG_FILE = "logs/anomalies.csv"

# ---------- Schemas ----------
class TrafficRecord(BaseModel):
    src_ip: str
    dst_ip: str
    bytes: int
    packets: int
    protocol: str   # e.g., "TCP" or "UDP"
    process: str | None = None  # optional field for process name

class BatchIn(BaseModel):
    records: List[TrafficRecord]

class AnalyzeOut(BaseModel):
    anomaly_scores: List[float]
    is_anomaly: List[bool]
    threshold: float

# ---------- Routes ----------
@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Network Anomaly Detection API running"}

@app.post("/train", tags=["model"])
def train(batch: BatchIn):
    df = pd.DataFrame([i.model_dump() for i in batch.records])
    X = model.features_from_df(df)
    model.fit(X)
    model.save()
    return {"trained_on": len(X), "features": list(X.columns)}

@app.post("/analyze", response_model=AnalyzeOut, tags=["inference"])
def analyze(batch: BatchIn):
    df = pd.DataFrame([i.model_dump() for i in batch.records])
    X = model.features_from_df(df)

    scores = model.score(X)
    is_anom = model.is_anomaly(X)

    # ----- Logging -----
    results = df.copy()
    results["anomaly_score"] = scores
    results["is_anomaly"] = is_anom
    results["timestamp"] = datetime.utcnow().isoformat()

    # 🔧 Ensure all required columns exist before saving
    required_cols = [
        "src_ip", "dst_ip", "bytes", "packets",
        "protocol", "process", "anomaly_score",
        "is_anomaly", "timestamp"
    ]
    for col in required_cols:
        if col not in results.columns:
            results[col] = None

    if not os.path.exists(LOG_FILE):
        results.to_csv(LOG_FILE, index=False, mode="w")
    else:
        results.to_csv(LOG_FILE, index=False, mode="a", header=False)

    return {
        "anomaly_scores": scores,
        "is_anomaly": is_anom,
        "threshold": model.threshold,
    }

@app.get("/logs", tags=["logs"])
def get_logs():
    """
    Returns the anomaly log file as JSON.
    """
    if not os.path.exists(LOG_FILE):
        return {"message": "No logs yet"}
    
    df = pd.read_csv(LOG_FILE)
    return df.to_dict(orient="records")


# ---------- Plotting ----------
import matplotlib.pyplot as plt
import io
from fastapi.responses import StreamingResponse

@app.get("/logs/plot", tags=["logs"])
def plot_logs():
    if not os.path.exists(LOG_FILE):
        return {"message": "No logs yet"}
    
    df = pd.read_csv(LOG_FILE)
    if "anomaly_score" not in df.columns:
        return {"message": "No scores to plot"}

    plt.figure(figsize=(8,4))
    plt.plot(df["timestamp"], df["anomaly_score"], marker="o", label="Anomaly Score")
    plt.axhline(y=model.threshold, color="r", linestyle="--", label="Threshold")
    plt.xticks(rotation=45)
    plt.legend()
    plt.title("Anomaly Scores Over Time")
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
