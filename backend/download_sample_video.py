import urllib.request
import os

# Free open-source traffic sample video URL
VIDEO_URL = "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4"
SAVE_PATH = os.path.join(os.path.dirname(__file__), "traffic_sample.mp4")

print(f"Downloading sample traffic video from open source repository...")
urllib.request.urlretrieve(VIDEO_URL, SAVE_PATH)
print(f"✓ Video successfully saved to: {SAVE_PATH}")