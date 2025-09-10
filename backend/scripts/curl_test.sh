
#!/usr/bin/env bash
set -e

API="http://127.0.0.1:8000"

echo "[*] Training model with sample batch..."
curl -s -X POST "$API/train"   -H "Content-Type: application/json"   -d @backend/samples/sample_batch.json | jq .

echo "[*] Analyzing sample batch..."
curl -s -X POST "$API/analyze"   -H "Content-Type: application/json"   -d @backend/samples/sample_batch.json | jq .
