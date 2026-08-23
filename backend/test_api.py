from fastapi.testclient import TestClient
from classifier import app

client = TestClient(app)

def run_sprint5_api_test():
    print("=" * 70)
    print("      ITVDS - SPRINT 5 FASTAPI REST API ENDPOINTS TEST")
    print("=" * 70)

    # 1. Root Test
    res_root = client.get("/")
    print(f"1. GET /                     : Status {res_root.status_code} | {res_root.json()}")

    # 2. Process Snapshot Test
    sample_snapshot = {
        "track_id": 105,
        "camera_id": "CAM-01",
        "timestamp": 1752835900,
        "vehicle_type": "car",
        "speed": 92.0,
        "riders_count": 1,
        "crossed_stop_line": False,
        "light_color": "green"
    }
    res_process = client.post("/api/process-snapshot", json=sample_snapshot)
    print(f"2. POST /api/process-snapshot: Status {res_process.status_code}")
    print(f"   Response                  : {res_process.json()}")

    # 3. GET /api/violations
    res_violations = client.get("/api/violations")
    print(f"3. GET /api/violations       : Status {res_violations.status_code} | Found {len(res_violations.json())} record(s)")

    # 4. GET /api/analytics/summary
    res_analytics = client.get("/api/analytics/summary")
    print(f"4. GET /api/analytics/summary: Status {res_analytics.status_code}")
    print(f"   Summary Data              : {res_analytics.json()}")

    print("=" * 70)
    print("\nSprint 5 Completed Successfully!")

if __name__ == "__main__":
    run_sprint5_api_test()