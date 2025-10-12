from fastapi import APIRouter, HTTPException

from datetime import datetime

router = APIRouter()


@router.get("/api/alerts")
async def get_alerts():
    """Get all alerts from both network and email collections"""
    try:
        network_alerts = list(network_collection.find().sort("timestamp", -1))
        email_alerts = list(email_collection.find().sort("timestamp", -1))
        
        all_alerts = network_alerts + email_alerts
        
        # Sort by timestamp (most recent first)
        all_alerts.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Convert ObjectId to string
        for alert in all_alerts:
            alert['_id'] = str(alert['_id'])
        
        return all_alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert by ID"""
    try:
        # Try to delete from network collection first
        result = network_collection.delete_one({"_id": ObjectId(alert_id)})
        
        # If not found, try email collection
        if result.deleted_count == 0:
            result = email_collection.delete_one({"_id": ObjectId(alert_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {"message": "Alert deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/alerts/{alert_id}/review")
async def mark_alert_reviewed(alert_id: str):
    """Mark an alert as reviewed"""
    try:
        # Try to update in network collection first
        result = network_collection.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {"reviewed": True}}
        )
        
        # If not found, try email collection
        if result.matched_count == 0:
            result = email_collection.update_one(
                {"_id": ObjectId(alert_id)},
                {"$set": {"reviewed": True}}
            )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {"message": "Alert marked as reviewed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
