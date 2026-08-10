import unittest
from backend.classifier import VehicleSnapshot, classify_snapshot

class TestViolationClassifier(unittest.TestCase):
    def test_speeding(self):
        snapshot = VehicleSnapshot(
            track_id=1,
            camera_id="CAM-01",
            timestamp=1752835205,
            vehicle_type="car",
            speed=95.0,
            crossed_stop_line=False,
            light_color="green"
        )
        response = classify_snapshot(snapshot)
        self.assertEqual(response.violation, "speeding")
        self.assertGreater(response.confidence, 0.9)

    def test_no_helmet(self):
        snapshot = VehicleSnapshot(
            track_id=2,
            camera_id="CAM-02",
            timestamp=1752835205,
            vehicle_type="motorcycle",
            speed=45.0,
            helmet_worn=False,
            crossed_stop_line=False,
            light_color="green"
        )
        response = classify_snapshot(snapshot)
        self.assertEqual(response.violation, "no_helmet")

    def test_red_light(self):
        snapshot = VehicleSnapshot(
            track_id=3,
            camera_id="CAM-03",
            timestamp=1752835205,
            vehicle_type="car",
            speed=30.0,
            crossed_stop_line=True,
            light_color="red"
        )
        response = classify_snapshot(snapshot)
        self.assertEqual(response.violation, "red_light")

    def test_no_violation(self):
        snapshot = VehicleSnapshot(
            track_id=4,
            camera_id="CAM-04",
            timestamp=1752835205,
            vehicle_type="car",
            speed=50.0,
            crossed_stop_line=False,
            light_color="green"
        )
        response = classify_snapshot(snapshot)
        self.assertIsNone(response.violation)

if __name__ == "__main__":
    unittest.main()
