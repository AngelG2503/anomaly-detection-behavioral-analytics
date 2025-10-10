from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Network Traffic Features
class NetworkFeatures(BaseModel):
    timestamp: datetime
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: float
    connection_duration: float
    port_number: int
    packets_sent: int
    packets_received: int
    bytes_sent: float
    bytes_received: float
    
# Email Communication Features
class EmailFeatures(BaseModel):
    timestamp: datetime
    sender_email: str
    receiver_email: str
    num_recipients: int
    email_size: float
    has_attachment: bool
    num_attachments: int
    subject_length: int
    body_length: int
    is_reply: bool
    is_forward: bool

# Combined Features (for systems monitoring both)
class CombinedFeatures(BaseModel):
    network: Optional[NetworkFeatures] = None
    email: Optional[EmailFeatures] = None
    user_id: str
    session_id: Optional[str] = None

# Prediction Response
class AnomalyPrediction(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    threat_class: Optional[str] = None
    confidence: float
    timestamp: datetime
    details: Optional[str] = None

# Batch Prediction Request
class BatchPredictionRequest(BaseModel):
    data: List[CombinedFeatures]
