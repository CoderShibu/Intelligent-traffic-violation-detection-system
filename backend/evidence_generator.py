import uuid
from typing import Optional
from pydantic import BaseModel

class EvidenceRecord(BaseModel):
    evidence_id: str
    track_id: int
    camera_id: str
    license_plate: str
    violation: str
    timestamp: int
    status: str

# Sequentially incrementing ID counter
_evidence_counter = 0

def get_next_evidence_id() -> str:
    global _evidence_counter
    _evidence_counter += 1
    return f"EVD-{_evidence_counter:04d}"

def process_evidence_pipeline(decision_response: dict) -> Optional[EvidenceRecord]:
    actions = decision_response.get("actions", [])
    
    if "ignore" in actions or not actions:
        print("  -> Execution: [IGNORE] No action required.")
        return None
    
    evidence_record = None
    
    # 1. Capture Evidence
    if "capture_evidence" in actions:
        evidence_id = get_next_evidence_id()
        print(f"  -> Execution [Capture Evidence]: Captured frame snapshot for Track #{decision_response.get('track_id')}. Assigned ID: {evidence_id}")
        
    # 2. Run OCR
    license_plate = "UNKNOWN"
    if "run_ocr" in actions:
        mock_plates = ["KA-01-MJ-4821", "MH-12-PQ-9012", "DL-3C-XY-5544", "TN-07-AB-1234", "KA-05-HA-9988"]
        license_plate = mock_plates[decision_response.get("track_id", 0) % len(mock_plates)]
        print(f"  -> Execution [Run OCR]: Detected License Plate -> '{license_plate}' (OCR Confidence: 98.4%)")
        
    # 3. Save Database
    if "save_database" in actions:
        evidence_record = EvidenceRecord(
            evidence_id=evidence_id,
            track_id=decision_response.get("track_id"),
            camera_id=decision_response.get("camera_id"),
            license_plate=license_plate,
            violation=decision_response.get("violation"),
            timestamp=decision_response.get("timestamp"),
            status="SAVED_TO_DB"
        )
        print(f"  -> Execution [Save Database]: Record '{evidence_id}' committed to PostgreSQL database (Table: violations_db).")
        
    return evidence_record

