import uuid
from typing import Optional
from pydantic import BaseModel

class EvidenceRecord(BaseModel):
    evidence_id: str
    track_id: int
    camera_id: str
    violation: str
    timestamp: int
    status: str

# Sequentially incrementing ID counter
_evidence_counter = 0

def get_next_evidence_id() -> str:
    global _evidence_counter
    _evidence_counter += 1
    return f"EVD-{_evidence_counter:04d}"

def generate_evidence(decision_response: dict) -> Optional[EvidenceRecord]:
    actions = decision_response.get("actions", [])
    
    if "capture_evidence" in actions:
        evidence_id = get_next_evidence_id()
        return EvidenceRecord(
            evidence_id=evidence_id,
            track_id=decision_response.get("track_id"),
            camera_id=decision_response.get("camera_id"),
            violation=decision_response.get("violation"),
            timestamp=decision_response.get("timestamp"),
            status="captured"
        )
    return None
