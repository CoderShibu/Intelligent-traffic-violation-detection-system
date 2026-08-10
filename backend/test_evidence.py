import json
from backend.mock_data import generate_mock_traffic_data
from backend.classifier import VehicleSnapshot, classify_snapshot
from backend.decision_engine import make_decision
from backend.evidence_generator import generate_evidence

def run_pipeline():
    print("=== Starting End-to-End Evidence pipeline test ===")
    
    # 1. Generate Mock Traffic Data
    mock_snapshots = generate_mock_traffic_data(10)
    print(f"Generated {len(mock_snapshots)} mock vehicle snapshot records.")
    
    evidence_records = []
    
    for idx, raw_snapshot in enumerate(mock_snapshots):
        print(f"\n--- Processing Vehicle Track {raw_snapshot['track_id']} ({raw_snapshot['vehicle_type']}) ---")
        
        # Parse into Pydantic model for classifier
        snapshot = VehicleSnapshot(**raw_snapshot)
        print(f"Snapshot details: Speed={snapshot.speed} km/h, Light={snapshot.light_color}, CrossedLine={snapshot.crossed_stop_line}, HelmetWorn={snapshot.helmet_worn}")
        
        # 2. Run Violation Classifier
        classification = classify_snapshot(snapshot)
        print(f"Classifier Output: Violation='{classification.violation}' (Confidence: {classification.confidence:.2f})")
        
        # 3. Run Decision Engine
        decision = make_decision(classification.model_dump())
        print(f"Decision Engine Output: Actions={decision.actions}, Status='{decision.status}'")
        
        # 4. Run Evidence Generator
        evidence = generate_evidence(decision.model_dump())
        if evidence:
            print(f"Evidence Generator Output: [SUCCESS] Generated Evidence Record:")
            print(json.dumps(evidence.model_dump(), indent=2))
            evidence_records.append(evidence)
        else:
            print(f"Evidence Generator Output: [SKIPPED] No evidence captured (no violation or decision ignore)")

    print("\n==================================================")
    print(f"Pipeline Test Complete. Captured {len(evidence_records)} evidence records.")
    print("==================================================")

if __name__ == "__main__":
    run_pipeline()
