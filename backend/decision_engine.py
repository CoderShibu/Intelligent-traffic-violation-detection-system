from typing import List, Optional
from pydantic import BaseModel

class DecisionResponse(BaseModel):
    track_id: int
    camera_id: str
    violation: Optional[str]
    timestamp: int
    actions: List[str]
    status: str

def make_decision(classification: dict) -> DecisionResponse:
    violation = classification.get("violation")
    confidence = classification.get("confidence", 0.0)
    
    actions = []
    status = "ignored"

    if violation and confidence >= 0.70:
        actions = ["capture_evidence", "run_ocr", "save_database"]
        status = "triggered"
    else:
        actions = ["ignore"]
        status = "ignored"

    return DecisionResponse(
        track_id=classification.get("track_id"),
        camera_id=classification.get("camera_id"),
        violation=violation,
        timestamp=classification.get("timestamp"),
        actions=actions,
        status=status
    )
