from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from decision_engine import make_decision
from evidence_generator import process_evidence_pipeline
from ocr_engine import process_ocr
from database import save_violation, get_all_violations, get_connection, init_db

app = FastAPI(
    title="Vigilens Violation Classifier API",
    description="Intelligent Traffic Violation Detection System API",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Input Models ---
class VehicleSnapshot(BaseModel):
    track_id: int
    camera_id: str
    timestamp: int
    vehicle_type: str
    speed: float
    helmet_worn: Optional[bool] = None
    crossed_stop_line: bool = False
    light_color: str = "green"
    riders_count: int = 1
    driving_direction: str = "correct"

# --- Output Models ---
class ClassificationResponse(BaseModel):
    track_id: int
    camera_id: str
    timestamp: int
    violation: Optional[str] = None
    confidence: float
    status: str = "classified"

# --- Original Classification Function ---
def classify_snapshot(snapshot: VehicleSnapshot) -> ClassificationResponse:
    violation = None
    confidence = 0.0

    if snapshot.light_color.lower() == "red" and snapshot.crossed_stop_line:
        violation = "red_light"
        confidence = 0.97
    elif snapshot.speed > 60.0:
        violation = "speeding"
        confidence = 0.95
    elif snapshot.vehicle_type == "motorcycle" and snapshot.helmet_worn is False:
        violation = "no_helmet"
        confidence = 0.94
    elif snapshot.vehicle_type == "motorcycle" and snapshot.riders_count > 2:
        violation = "triple_riding"
        confidence = 0.89
    elif snapshot.driving_direction.lower() == "wrong":
        violation = "wrong_way"
        confidence = 0.91

    return ClassificationResponse(
        track_id=snapshot.track_id,
        camera_id=snapshot.camera_id,
        timestamp=snapshot.timestamp,
        violation=violation,
        confidence=confidence,
        status="classified" if violation else "normal"
    )

@app.on_event("startup")
def startup_event():
    """Initialize SQLite DB on API Startup."""
    init_db()

@app.get("/")
def root():
    return {"system": "ITVDS", "status": "running", "version": "1.0.0"}

# --- Original Sprint 1 Endpoints ---
@app.post("/classify", response_model=ClassificationResponse)
def classify_endpoint(snapshot: VehicleSnapshot):
    return classify_snapshot(snapshot)

@app.post("/classify-batch", response_model=List[ClassificationResponse])
def classify_batch_endpoint(snapshots: List[VehicleSnapshot]):
    return [classify_snapshot(s) for s in snapshots]

# --- Sprint 5 Dashboard Endpoints ---
@app.post("/api/process-snapshot")
def process_full_pipeline(snapshot: VehicleSnapshot):
    """Runs full pipeline: Snapshot -> Classifier -> Decision -> Evidence -> OCR -> DB."""
    classification_res = classify_snapshot(snapshot)
    classification_dict = classification_res.dict()
    
    if not classification_dict["violation"]:
        return {"status": "normal", "message": "No violation detected"}

    # 1. Decision Engine
    decision = make_decision(classification_dict)

    # 2. Evidence Generator
    evidence = process_evidence_pipeline(decision.dict())
    if not evidence:
        return {"status": "ignored", "message": "No evidence action required"}

    # 3. OCR Recognition
    evidence_ocr = process_ocr(evidence)

    # 4. Save to SQLite Database
    saved_record = save_violation(evidence_ocr.dict())

    return {
        "status": "violation_processed",
        "result": saved_record
    }

@app.get("/api/violations")
def fetch_all_violations():
    """Endpoint for React Dashboard to list all violations."""
    return get_all_violations()

@app.get("/api/vehicles/repeat-offenders")
def fetch_repeat_offenders():
    """Endpoint for React Dashboard to display repeat offender panel."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicles WHERE is_repeat_offender = 1")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/analytics/summary")
def fetch_analytics_summary():
    """Endpoint for React Dashboard Analytics charts."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM violations")
    total_violations = cursor.fetchone()["total"]

    cursor.execute("SELECT SUM(fine_amount) as total_fines FROM violations")
    sum_row = cursor.fetchone()
    total_fines = sum_row["total_fines"] if sum_row["total_fines"] else 0.0

    cursor.execute("SELECT COUNT(*) as count FROM vehicles WHERE is_repeat_offender = 1")
    repeat_offenders_count = cursor.fetchone()["count"]

    cursor.execute("""
        SELECT violation_type, COUNT(*) as count 
        FROM violations 
        GROUP BY violation_type
    """)
    breakdown = {row["violation_type"]: row["count"] for row in cursor.fetchall()}

    conn.close()

    return {
        "total_violations": total_violations,
        "total_fines_amount": total_fines,
        "repeat_offenders_count": repeat_offenders_count,
        "violation_type_breakdown": breakdown
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)