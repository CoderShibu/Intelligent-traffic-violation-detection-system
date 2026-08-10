import json
from backend.mock_data import generate_mock_traffic_data
from backend.classifier import VehicleSnapshot, classify_snapshot
from backend.decision_engine import make_decision
from backend.evidence_generator import process_evidence_pipeline

def run_pipeline():
    print("==================================================")
    print("  INTELLIGENT TRAFFIC VIOLATION DETECTION SYSTEM  ")
    print("   Pipeline Execution: Classifier -> Decision -> System Actions")
    print("==================================================\n")
    
    # 1. Generate Mock Traffic Data
    mock_snapshots = generate_mock_traffic_data(6)
    print(f"[*] Generated {len(mock_snapshots)} vehicle snapshot records from camera feeds.\n")
    
    evidence_records = []
    
    for idx, raw_snapshot in enumerate(mock_snapshots):
        print(f"--- Processing Vehicle Track #{raw_snapshot['track_id']} ({raw_snapshot['vehicle_type'].upper()}) ---")
        
        # Parse into Pydantic model for classifier
        snapshot = VehicleSnapshot(**raw_snapshot)
        print(f"1. Snapshot Details : Speed={snapshot.speed} km/h, Light={snapshot.light_color}, CrossedLine={snapshot.crossed_stop_line}, Helmet={snapshot.helmet_worn}")
        
        # 2. Run Violation Classifier
        classification = classify_snapshot(snapshot)
        print(f"2. Classifier Output: Violation='{classification.violation}' (Confidence: {classification.confidence:.2f})")
        
        # 3. Run Decision Engine
        decision = make_decision(classification.model_dump())
        print(f"3. Decision Engine  : Actions={decision.actions}, Status='{decision.status}'")
        
        # 4. Pipeline Execution Actions: Capture Evidence -> Run OCR -> Save Database
        print("4. Executing System Actions:")
        evidence = process_evidence_pipeline(decision.model_dump())
        if evidence:
            evidence_records.append(evidence)
            print(f"  => Final Record JSON:\n{json.dumps(evidence.model_dump(), indent=4)}")
        print()

    print("==================================================")
    print(f"[SUMMARY] Pipeline Completed. Captured & Saved {len(evidence_records)} Violation Records to Database.")
    print("==================================================")

if __name__ == "__main__":
    run_pipeline()

