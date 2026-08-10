import time
import random

# Generate a list of mock vehicle snapshot records
def generate_mock_traffic_data(count=15):
    cameras = ["CAM-01", "CAM-02", "CAM-03", "CAM-04", "CAM-05"]
    vehicle_types = ["car", "motorcycle", "truck", "bus", "auto"]
    light_colors = ["red", "green", "yellow"]
    directions = ["correct", "wrong"]

    mock_records = []
    base_timestamp = int(time.time())

    for i in range(count):
        v_type = random.choice(vehicle_types)
        speed = round(random.uniform(30.0, 110.0), 1)  # Speeding might occur (> 80)
        
        # Motorcycle specific metadata
        helmet_worn = None
        riders_count = 1
        if v_type == "motorcycle":
            helmet_worn = random.choice([True, False])
            riders_count = random.choice([1, 2, 3])  # Triple riding is > 2

        # Traffic light scenario
        light = random.choice(light_colors)
        crossed_line = False
        if light == "red":
            crossed_line = random.choice([True, False])
        
        direction = random.choices(directions, weights=[0.9, 0.1])[0]  # 10% wrong way

        record = {
            "track_id": 100 + i,
            "camera_id": random.choice(cameras),
            "timestamp": base_timestamp - (i * 30),  # staggered back in time
            "vehicle_type": v_type,
            "speed": speed,
            "helmet_worn": helmet_worn,
            "crossed_stop_line": crossed_line,
            "light_color": light,
            "riders_count": riders_count,
            "driving_direction": direction
        }
        mock_records.append(record)

    return mock_records

if __name__ == "__main__":
    import json
    data = generate_mock_traffic_data(5)
    print(json.dumps(data, indent=2))
