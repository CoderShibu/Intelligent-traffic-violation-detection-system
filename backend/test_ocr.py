"""
Sprint 3 Integration Test Script
Pipeline: Mock Data -> FastAPI Classifier -> Decision Engine -> Evidence Generator -> OCR Engine
"""

import sys
import os

# Ensure local backend scripts can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_engine import process_ocr, EvidenceRecord

# Mock dataset representing pipeline outputs
MOCK_PIPELINE_DATA = [
    {
        "snapshot": {
            "track_id": 102,
            "camera_id": "CAM-01",
            "timestamp": 1752835205,
            "vehicle_type": "car",
            "speed": 85.5,
            "riders_count": 1,
            "crossed_stop_line": False,
            "light_color": "green"
        },
        "violation": "speeding",
        "actions": ["capture_evidence", "run_ocr", "save_database", "update_dashboard"]
    },
    {
        "snapshot": {
            "track_id": 104,
            "camera_id": "CAM-02",
            "timestamp": 1752835310,
            "vehicle_type": "motorcycle",
            "speed": 45.0,
            "helmet_worn": False,
            "riders_count": 1,
            "crossed_stop_line": False,
            "light_color": "green"
        },
        "violation": "no_helmet",
        "actions": ["capture_evidence", "run_ocr", "save_database", "update_dashboard"]
    },
    {
        "snapshot": {
            "track_id": 105,
            "camera_id": "CAM-03",
            "timestamp": 1752835400,
            "vehicle_type": "car",
            "speed": 55.0,
            "riders_count": 1,
            "crossed_stop_line": True,
            "light_color": "red"
        },
        "violation": "red_light",
        "actions": ["capture_evidence", "run_ocr", "save_database", "update_dashboard"]
    },
    {
        "snapshot": {
            "track_id": 107,
            "camera_id": "CAM-01",
            "timestamp": 1752835520,
            "vehicle_type": "motorcycle",
            "speed": 40.0,
            "riders_count": 3,
            "crossed_stop_line": False,
            "light_color": "green"
        },
        "violation": "triple_riding",
        "actions": ["capture_evidence", "run_ocr", "save_database", "update_dashboard"]
    }
]

def run_sprint3_ocr_test():
    print("=" * 70)
    print("      ITVDS - SPRINT 3 END-TO-END OCR PIPELINE TEST")
    print("=" * 70)

    evidence_counter = 1
    processed_records = []

    for item in MOCK_PIPELINE_DATA:
        snap = item["snapshot"]
        violation_type = item["violation"]
        evd_id = f"EVD-{evidence_counter:04d}"
        evidence_counter += 1

        # Build initial EvidenceRecord from Sprint 2
        initial_evidence = EvidenceRecord(
            evidence_id=evd_id,
            track_id=snap["track_id"],
            camera_id=snap["camera_id"],
            license_plate="PENDING_OCR",
            violation=violation_type,
            timestamp=snap["timestamp"],
            status="captured"
        )

        # Run Sprint 3 OCR Processing & Validation
        final_evidence = process_ocr(initial_evidence)
        processed_records.append(final_evidence)

    print("\n" + "=" * 70)
    print("               SPRINT 3 OCR RESULTS SUMMARY")
    print("=" * 70)
    for rec in processed_records:
        print(f" Evidence ID : {rec.evidence_id}")
        print(f" Track ID    : {rec.track_id}")
        print(f" Camera ID   : {rec.camera_id}")
        print(f" Violation   : {rec.violation}")
        print(f" Plate No.   : {rec.license_plate}")
        print(f" Status      : {rec.status}")
        print("-" * 70)

    print("\nSprint 3 Completed Successfully!")

if __name__ == "__main__":
    run_sprint3_ocr_test()