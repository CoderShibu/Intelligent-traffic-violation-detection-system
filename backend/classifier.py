from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Vigilens Violation Classifier API")

# Input models
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

# Output models
class ClassificationResponse(BaseModel):
    track_id: int
    camera_id: str
    timestamp: int
    violation: Optional[str] = None  # e.g., "speeding", "no_helmet", "red_light", "triple_riding", "wrong_way", or None
    confidence: float
    status: str = "classified"

def classify_snapshot(snapshot: VehicleSnapshot) -> ClassificationResponse:
    # Set default values
    violation = None
    confidence = 0.0

    # Rule-based classification
    if snapshot.light_color == "red" and snapshot.crossed_stop_line:
        violation = "red_light"
        confidence = 0.97
    elif snapshot.speed > 80.0:
        violation = "speeding"
        confidence = 0.95
    elif snapshot.vehicle_type == "motorcycle" and snapshot.helmet_worn is False:
        violation = "no_helmet"
        confidence = 0.94
    elif snapshot.vehicle_type == "motorcycle" and snapshot.riders_count > 2:
        violation = "triple_riding"
        confidence = 0.89
    elif snapshot.driving_direction == "wrong":
        violation = "wrong_way"
        confidence = 0.91

    return ClassificationResponse(
        track_id=snapshot.track_id,
        camera_id=snapshot.camera_id,
        timestamp=snapshot.timestamp,
        violation=violation,
        confidence=confidence
    )

@app.post("/classify", response_model=ClassificationResponse)
def classify_endpoint(snapshot: VehicleSnapshot):
    return classify_snapshot(snapshot)

@app.post("/classify-batch", response_model=List[ClassificationResponse])
def classify_batch_endpoint(snapshots: List[VehicleSnapshot]):
    return [classify_snapshot(s) for s in snapshots]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
