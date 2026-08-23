import sqlite3
import os
from typing import Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "violations.db")

# Base Fines in INR (Indian Rupees)
BASE_FINES = {
    "speeding": 1000,
    "red_light": 1000,
    "signal_jumping": 1000,
    "no_helmet": 500,
    "triple_riding": 1000,
    "wrong_way": 500,
    "lane_violation": 500
}

def get_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes database tables if they do not exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Vehicles Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehicles (
            plate_number TEXT PRIMARY KEY,
            owner_name TEXT DEFAULT 'UNKNOWN',
            vehicle_type TEXT,
            violation_count INTEGER DEFAULT 0,
            is_repeat_offender BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Violations Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS violations (
            violation_id INTEGER PRIMARY KEY AUTOINCREMENT,
            evidence_id TEXT UNIQUE,
            track_id INTEGER,
            camera_id TEXT,
            plate_number TEXT,
            violation_type TEXT,
            fine_amount REAL,
            is_repeat_offender BOOLEAN DEFAULT 0,
            payment_status TEXT DEFAULT 'PENDING',
            timestamp INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (plate_number) REFERENCES vehicles(plate_number)
        )
    """)

    # 3. Analytics Log Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analytics_log (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER,
            event_type TEXT,
            description TEXT
        )
    """)

    conn.commit()
    conn.close()

def calculate_fine(violation_type: str, is_repeat_offender: bool) -> float:
    """Calculates effective fine amount, doubling fine if repeat offender."""
    base_fine = BASE_FINES.get(violation_type.lower(), 500)
    return float(base_fine * 2 if is_repeat_offender else base_fine)

def save_violation(evidence_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves an evidence record into SQLite database.
    Updates vehicle violation count and repeat offender status automatically.
    """
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    plate = evidence_data.get("license_plate", "UNKNOWN_PLATE")
    violation_type = evidence_data.get("violation", "unknown")
    evidence_id = evidence_data.get("evidence_id")
    track_id = evidence_data.get("track_id")
    camera_id = evidence_data.get("camera_id")
    timestamp = evidence_data.get("timestamp")

    # Fetch or create vehicle record
    cursor.execute("SELECT violation_count FROM vehicles WHERE plate_number = ?", (plate,))
    row = cursor.fetchone()

    if row:
        new_count = row["violation_count"] + 1
        is_repeat = new_count >= 3
        cursor.execute("""
            UPDATE vehicles 
            SET violation_count = ?, is_repeat_offender = ?
            WHERE plate_number = ?
        """, (new_count, is_repeat, plate))
    else:
        new_count = 1
        is_repeat = False
        cursor.execute("""
            INSERT INTO vehicles (plate_number, vehicle_type, violation_count, is_repeat_offender)
            VALUES (?, ?, ?, ?)
        """, (plate, "auto", new_count, is_repeat))

    # Calculate fine amount (doubles if repeat offender)
    fine_amount = calculate_fine(violation_type, is_repeat)

    # Insert violation record
    cursor.execute("""
        INSERT INTO violations (
            evidence_id, track_id, camera_id, plate_number, 
            violation_type, fine_amount, is_repeat_offender, payment_status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    """, (evidence_id, track_id, camera_id, plate, violation_type, fine_amount, is_repeat, timestamp))

    # Log analytics event
    cursor.execute("""
        INSERT INTO analytics_log (timestamp, event_type, description)
        VALUES (?, 'VIOLATION_RECORDED', ?)
    """, (timestamp, f"Recorded {violation_type} for {plate} with fine INR {fine_amount}"))

    conn.commit()
    conn.close()

    return {
        "evidence_id": evidence_id,
        "plate_number": plate,
        "violation_type": violation_type,
        "total_violations": new_count,
        "is_repeat_offender": is_repeat,
        "fine_amount": fine_amount,
        "payment_status": "PENDING"
    }

def get_all_violations() -> List[Dict[str, Any]]:
    """Retrieves all stored violations."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM violations ORDER BY violation_id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows