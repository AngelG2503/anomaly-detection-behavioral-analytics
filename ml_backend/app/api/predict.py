from fastapi import APIRouter, HTTPException
from app.models.schemas import NetworkFeatures, EmailFeatures, AnomalyPrediction
from app.models.anomaly_detector import AnomalyDetector
import numpy as np
from datetime import datetime

router = APIRouter()

# Initialize and load trained models
detector = AnomalyDetector()
detector.load_models()

def extract_network_features(data: NetworkFeatures):
    """Convert NetworkFeatures to numpy array"""
    return np.array([
        data.packet_size,
        data.connection_duration,
        data.port_number,
        data.packets_sent,
        data.packets_received,
        data.bytes_sent,
        data.bytes_received,
        # Add time-based features
        data.timestamp.hour,
        data.timestamp.weekday(),
        # Protocol encoding (simplified)
        1 if data.protocol.lower() == 'tcp' else 0,
        1 if data.protocol.lower() == 'udp' else 0,
    ])

def extract_email_features(data: EmailFeatures):
    """Convert EmailFeatures to numpy array"""
    return np.array([
        data.num_recipients,
        data.email_size,
        1 if data.has_attachment else 0,
        data.num_attachments,
        data.subject_length,
        data.body_length,
        1 if data.is_reply else 0,
        1 if data.is_forward else 0,
        # Time-based features
        data.timestamp.hour,
        data.timestamp.weekday(),
        # Sender domain length (simplified)
        len(data.sender_email.split('@')[1]) if '@' in data.sender_email else 0,
    ])

@router.post("/predict/network", response_model=AnomalyPrediction)
async def predict_network(data: NetworkFeatures):
    """Predict anomaly for network traffic"""
    try:
        # Extract features
        features = extract_network_features(data)
        
        # Predict anomaly
        is_anomaly, anomaly_score = detector.predict_network_anomaly(features)
        
        # Classify threat if anomaly detected
        threat_class = None
        confidence = 0.0
        
        if is_anomaly:
            threat_class, confidence = detector.classify_threat(features)
        
        return AnomalyPrediction(
            is_anomaly=is_anomaly,
            anomaly_score=anomaly_score,
            threat_class=threat_class,
            confidence=confidence if is_anomaly else anomaly_score,
            timestamp=datetime.now(),
            details=f"Network traffic from {data.source_ip} to {data.destination_ip}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/predict/email", response_model=AnomalyPrediction)
async def predict_email(data: EmailFeatures):
    """Predict anomaly for email communication"""
    try:
        # Extract features
        features = extract_email_features(data)
        
        # Predict anomaly
        is_anomaly, anomaly_score = detector.predict_email_anomaly(features)
        
        # Classify threat if anomaly detected
        threat_class = None
        confidence = 0.0
        
        if is_anomaly:
            threat_class, confidence = detector.classify_threat(features)
        
        return AnomalyPrediction(
            is_anomaly=is_anomaly,
            anomaly_score=anomaly_score,
            threat_class=threat_class,
            confidence=confidence if is_anomaly else anomaly_score,
            timestamp=datetime.now(),
            details=f"Email from {data.sender_email} to {data.receiver_email}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/models/status")
async def model_status():
    """Check if models are loaded"""
    return {
        "network_detector": detector.network_detector is not None,
        "email_detector": detector.email_detector is not None,
        "threat_classifier": detector.threat_classifier is not None
    }
