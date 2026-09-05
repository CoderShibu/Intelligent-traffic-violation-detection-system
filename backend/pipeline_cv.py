"""
ITVDS Computer Vision & Video Processing Pipeline
Combines OpenCV + YOLOv8 Vehicle Detection + Tracking + FastAPI Backend
"""

import cv2
import numpy as np
import time
import os
import sys

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from classifier import process_full_pipeline, VehicleSnapshot

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

class TrafficVisionPipeline:
    def __init__(self, video_source=0, model_path="yolov8n.pt"):
        """
        Initializes OpenCV Video Capture and YOLOv8 Model.
        video_source can be a video file path (e.g. 'traffic.mp4') or 0 for webcam.
        """
        self.video_source = video_source
        self.cap = cv2.VideoCapture(video_source)
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        
        # Track history storing previous centroid positions {track_id: (x, y, timestamp)}
        self.track_history = {}
        
        # Calibration factor: pixels to meters conversion for speed estimation
        self.P2M_FACTOR = 0.05  # 1 pixel = 0.05 meters (approximate)

        if YOLO_AVAILABLE:
            print(f"[VISION PIPELINE] Loading YOLOv8 Model ({model_path})...")
            try:
                self.model = YOLO(model_path)
            except Exception as e:
                print(f"[VISION PIPELINE WARNING] Could not load YOLO weights: {e}")
                self.model = None
        else:
            print("[VISION PIPELINE WARNING] Ultralytics package not installed. Running in CV Simulation Mode.")
            self.model = None

    def estimate_speed(self, track_id: int, current_pos: tuple, current_time: float) -> float:
        """
        Calculates vehicle speed in km/h based on displacement over time.
        """
        if track_id in self.track_history:
            prev_x, prev_y, prev_time = self.track_history[track_id]
            time_diff = current_time - prev_time
            
            if time_diff > 0:
                # Euclidean distance in pixels
                distance_pixels = np.sqrt((current_pos[0] - prev_x)**2 + (current_pos[1] - prev_y)**2)
                distance_meters = distance_pixels * self.P2M_FACTOR
                speed_mps = distance_meters / time_diff
                speed_kmh = speed_mps * 3.6
                
                self.track_history[track_id] = (current_pos[0], current_pos[1], current_time)
                return round(speed_kmh, 1)

        self.track_history[track_id] = (current_pos[0], current_pos[1], current_time)
        return 45.0  # Baseline normal speed

    def process_video_stream(self, max_frames=100, display=False):
        """
        Processes video frame-by-frame, extracts detections, and sends violations to backend.
        """
        print("=" * 75)
        print("      ITVDS - FINAL LAYER: LIVE VISION PIPELINE PROCESSING")
        print("=" * 75)

        frame_count = 0
        violations_processed = 0

        while self.cap.isOpened() and frame_count < max_frames:
            ret, frame = self.cap.read()
            if not ret:
                break

            frame_count += 1
            current_time = time.time()

            # If YOLOv8 model is loaded, run inference
            if self.model:
                results = self.model.track(frame, persist=True, verbose=False)
                
                for r in results:
                    boxes = r.boxes
                    if boxes is not None and boxes.id is not None:
                        for box, track_id in zip(boxes.xyxy, boxes.id):
                            x1, y1, x2, y2 = map(int, box)
                            tid = int(track_id)
                            centroid = ((x1 + x2) // 2, (y1 + y2) // 2)
                            
                            # Estimate speed
                            speed = self.estimate_speed(tid, centroid, current_time)

                            # Build VehicleSnapshot for backend
                            snapshot = VehicleSnapshot(
                                track_id=tid,
                                camera_id="CAM-01",
                                timestamp=int(current_time),
                                vehicle_type="car",
                                speed=speed,
                                helmet_worn=True,
                                crossed_stop_line=False,
                                light_color="green"
                            )

                            # Call Backend Pipeline
                            res = process_full_pipeline(snapshot)
                            if res.get("status") == "violation_processed":
                                violations_processed += 1
            else:
                # Simulation Frame Processing
                if frame_count % 20 == 0:
                    sim_track_id = 200 + (frame_count // 20)
                    sim_speed = 88.5 if frame_count == 40 else 42.0
                    
                    snapshot = VehicleSnapshot(
                        track_id=sim_track_id,
                        camera_id="CAM-01",
                        timestamp=int(current_time),
                        vehicle_type="car",
                        speed=sim_speed,
                        helmet_worn=True,
                        crossed_stop_line=(frame_count == 60),
                        light_color="red" if frame_count == 60 else "green"
                    )
                    
                    res = process_full_pipeline(snapshot)
                    if res.get("status") == "violation_processed":
                        violations_processed += 1
                        print(f"  [FRAME {frame_count}] Violation Detected & Logged -> Track ID #{sim_track_id} (Speed: {sim_speed} km/h)")

        self.cap.release()
        print("\n" + "=" * 75)
        print(f" Vision Pipeline Stream Complete. Processed {frame_count} frames, Logged {violations_processed} violation(s).")
        print("=" * 75)

if __name__ == "__main__":
    pipeline = TrafficVisionPipeline()
    pipeline.process_video_stream(max_frames=100)