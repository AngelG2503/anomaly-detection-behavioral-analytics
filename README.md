
# Net Anomaly App — Step 1 (Backend Skeleton)

This is the first step of a step-by-step build for a **Network Anomaly Detection** app.
In this step we scaffold a minimal **FastAPI** backend with endpoints to **train** and **analyze**
using a simple **Isolation Forest** model. Live packet capture will be added in a later step.

## What’s included
- `backend/app.py` — FastAPI app with `/`, `/train`, `/analyze` endpoints
- `backend/model.py` — Isolation Forest wrapper with save/load
- `backend/requirements.txt` — Python dependencies
- `backend/data/` — Model & data folder (created on first save)
- `backend/samples/sample_batch.json` — Example payload to test the API
- `backend/scripts/curl_test.sh` — Simple curl commands to try the API

## Quick start

### 1) Create & activate a virtualenv (recommended)
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

### 2) Install dependencies
```bash
pip install -r backend/requirements.txt
```

### 3) Run the API
```bash
uvicorn backend.app:app --reload
```
The API will be available at: http://127.0.0.1:8000

Open the interactive docs at: http://127.0.0.1:8000/docs

### 4) Train the model (with dummy data)
```bash
curl -X POST http://127.0.0.1:8000/train \
  -H "Content-Type: application/json" \
  -d @backend/samples/sample_batch.json
```

### 5) Analyze a batch
```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d @backend/samples/sample_batch.json
```

> **Note:** In Step 1 we accept **features as JSON**. In Step 2 we’ll add **live/offline packet capture**
and turn raw packets into these features.

---

## Payload schema (for /train and /analyze)

```json
{
  "items": [
    { "src": "10.0.0.2", "dst": "10.0.0.1", "size": 520, "proto": 6, "ts": 1725530000.12 },
    { "src": "10.0.0.2", "dst": "10.0.0.3", "size": 64,  "proto": 17, "ts": 1725530000.23 }
  ]
}
```

- `src`, `dst` — optional strings (IP addresses), ignored by Step 1 model
- `size` — integer, packet length in bytes
- `proto` — integer protocol number (TCP=6, UDP=17, ICMP=1, etc.)
- `ts` — optional timestamp (epoch seconds)

The Step 1 model uses **only** numeric features (`size`, `proto`). We’ll engineer richer features later.

---

## Next steps
- **Step 2:** Add packet capture & feature extraction (Scapy/PyShark), plus richer time-based features.
- **Step 3:** Persist alerts to a database and add thresholds.
- **Step 4:** Build a React dashboard to visualize traffic & anomalies.
