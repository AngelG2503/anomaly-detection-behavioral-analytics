from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import NetworkFeatures, EmailFeatures, CombinedFeatures, AnomalyPrediction
from app.api.predict import router as predict_router
from app.api.alerts import router as alerts_router  # NEW

app = FastAPI(
    title="Behavioral Anomaly Detection API",
    description="ML Backend for Network and Email Anomaly Detection",
    version="1.0.0"
)

# Configure CORS to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict_router, tags=["Predictions"])
app.include_router(alerts_router, tags=["Alerts"])  # NEW

@app.get("/")
async def root():
    return {
        "message": "Behavioral Anomaly Detection ML API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
