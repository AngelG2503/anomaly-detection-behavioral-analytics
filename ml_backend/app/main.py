from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import NetworkFeatures, EmailFeatures, CombinedFeatures, AnomalyPrediction
from app.api.predict import router as predict_router

app = FastAPI(
    title="Behavioral Anomaly Detection API",
    description="ML Backend for Network and Email Anomaly Detection",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include prediction routes
app.include_router(predict_router, prefix="/api", tags=["Predictions"])

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
