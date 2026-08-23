"""
Sprint 4 End-to-End Test Script
Pipeline: Mock Data -> Classifier -> Decision Engine -> Evidence -> OCR -> SQLite Database
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_engine import process_ocr, EvidenceRecord
from database import save_violation, get_all_violations, init_db

# Mock pipeline records with repeated violations for KA01AB1234 (track_id 101) to test repeat offender logic
MOCK_PIPELINE_RECORDS = [
    {
        "evidence_id": "EVD-0001",
        "track_id": 101,  # KA01AB1234 (1st violation)
        "camera_id": "CAM-01",
        "violation": "speeding",
        "timestamp": 1752835200
    },
    {
        "evidence_id": "EVD-0002",
        "track_id": 104,  # TN07XY4321
        "camera_id": "CAM-02",
        "violation": "no_helmet",
        "timestamp": 1752835300
    },
    {
        "evidence_id": "EVD-0003",
        "track_id": 101,  # KA01AB1234 (2nd violation)
        "camera_id": "CAM-03",
        "violation": "red_light",
        "timestamp": 1752835400
    },
    {
        "evidence_id": "EVD-0004",
        "track_id": 101,  # KA01AB1234 (3rd violation -> REPEAT OFFENDER TRIGGERED!)
        "camera_id": "CAM-01",
        "violation": "wrong_way",
        "timestamp": 1752835500
    }
]

def run_sprint4_db_test():
    print("=" * 75)
    print("      ITVDS - SPRINT 4 DATABASE & FINE CALCULATION TEST")
    print("=" * 75)

    # Re-initialize database
    init_db()

    for item in MOCK_PIPELINE_RECORDS:
        # Build initial EvidenceRecord
        evd = EvidenceRecord(
            evidence_id=item["evidence_id"],
            track_id=item["track_id"],
            camera_id=item["camera_id"],
            license_plate="PENDING_OCR",
            violation=item["violation"],
            timestamp=item["timestamp"],
            status="captured"
        )

        # Run OCR Module
        evd_ocr = process_ocr(evd)

        # Save to SQLite Database
        db_result = save_violation(evd_ocr.dict())

        print("\n  [DATABASE RECORD SAVED]")
        print(f"  Plate Number       : {db_result['plate_number']}")
        print(f"  Violation Type     : {db_result['violation_type']}")
        print(f"  Total Violations   : {db_result['total_violations']}")
        print(f"  Repeat Offender    : {db_result['is_repeat_offender']}")
        print(f"  Fine Amount        : INR {db_result['fine_amount']}")
        if db_result['is_repeat_offender']:
            print("  [ALERT] Repeat Offender Flagged! Fine Doubled (2x Base Fine)!")
        print("-" * 75)

    print("\n" + "=" * 75)
    print("              FINAL DATABASE TABLE CONTENTS")
    print("=" * 75)
    records = get_all_violations()
    for r in records:
        print(f"ID #{r['violation_id']} | Plate: {r['plate_number']} | Type: {r['violation_type']} | Fine: INR {r['fine_amount']} | Repeat: {bool(r['is_repeat_offender'])}")
    print("=" * 75)
    print("\nSprint 4 Completed Successfully!")

if __name__ == "__main__":
    run_sprint4_db_test()