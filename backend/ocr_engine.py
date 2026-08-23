import re
import random
from typing import Optional
from pydantic import BaseModel

# Import EvidenceRecord from evidence_generator if available
try:
    from evidence_generator import EvidenceRecord
except ImportError:
    class EvidenceRecord(BaseModel):
        evidence_id: str
        track_id: int
        camera_id: str
        license_plate: str
        violation: str
        timestamp: int
        status: str

# Standard Indian License Plate Format:
# Examples: KA01AB1234, MH12DE5678, DL03C9999, HR26DQ1122
INDIAN_PLATE_REGEX = r"^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$"

# Mock pool of license plates for simulation testing
MOCK_LICENSE_PLATES = {
    101: "KA01AB1234",
    102: "MH12DE5678",
    103: "DL03CB9999",
    104: "TN07XY4321",
    105: "HR26DQ1122",
    106: "KA05MK8888",
    107: "AP09BZ5544",
    108: "UP16AT7711",
}

def validate_license_plate(plate_number: str) -> bool:
    """
    Validates if the recognized text matches standard Indian Vehicle Registration Regex.
    Pattern: ^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$
    """
    if not plate_number:
        return False
    clean_plate = re.sub(r"[^A-Z0-9]", "", plate_number.upper())
    return bool(re.match(INDIAN_PLATE_REGEX, clean_plate))

def process_ocr(evidence: EvidenceRecord, mock_confidence: float = 0.95) -> EvidenceRecord:
    """
    Simulates Automatic License Plate Recognition (ALPR) / OCR step.
    In Sprint 6, this function will be swapped with PaddleOCR calling crop_image.
    """
    print(f"\n[OCR MODULE] Processing Track ID: {evidence.track_id} (Evidence ID: {evidence.evidence_id})...")
    
    # Retrieve mock license plate or generate synthetic plate
    raw_plate = MOCK_LICENSE_PLATES.get(
        evidence.track_id, 
        f"KA{random.randint(10,99)}AB{random.randint(1000,9999)}"
    )

    is_valid = validate_license_plate(raw_plate)
    
    if is_valid:
        evidence.license_plate = raw_plate
        evidence.status = "ocr_completed"
        print(f"  [SUCCESS] OCR Recognition Success: License Plate = '{raw_plate}' (Confidence: {mock_confidence*100:.1f}%)")
        print(f"  [REGEX OK] Regex Validation: MATCHED Indian Vehicle Standard ({INDIAN_PLATE_REGEX})")
    else:
        evidence.license_plate = "UNKNOWN_PLATE"
        evidence.status = "ocr_failed"
        print(f"  [FAILED] OCR Recognition Failed: Plate '{raw_plate}' does not conform to standard format.")

    return evidence