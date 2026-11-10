"""
Dataset Generation Script for SmartPark AI
Generates a realistic, comprehensive historical smart parking dataset across 5 locations.
"""

import os
import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_parking_dataset(output_path: str = "data/smart_parking_dataset.csv", num_days: int = 90):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    locations = [
        {
            "location_id": "LOC001",
            "location_name": "Downtown Metro Hub",
            "capacity": 250,
            "type": "Transit / Commuter",
            "base_rate": 0.35,
            "weekday_peak_hours": [7, 8, 9, 17, 18, 19],
            "weekend_factor": 0.45,
            "volatility": 0.08
        },
        {
            "location_id": "LOC002",
            "location_name": "Tech Park Plaza",
            "capacity": 320,
            "type": "Commercial / IT Office",
            "base_rate": 0.25,
            "weekday_peak_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17],
            "weekend_factor": 0.20,
            "volatility": 0.06
        },
        {
            "location_id": "LOC003",
            "location_name": "Grand Central Mall",
            "capacity": 400,
            "type": "Retail & Entertainment",
            "base_rate": 0.30,
            "weekday_peak_hours": [12, 13, 18, 19, 20],
            "weekend_factor": 1.40,
            "volatility": 0.09
        },
        {
            "location_id": "LOC004",
            "location_name": "Airport Terminal 2",
            "capacity": 500,
            "type": "Travel & Transportation",
            "base_rate": 0.65,
            "weekday_peak_hours": [5, 6, 7, 8, 18, 19, 20, 21],
            "weekend_factor": 1.05,
            "volatility": 0.07
        },
        {
            "location_id": "LOC005",
            "location_name": "University Campus North",
            "capacity": 180,
            "type": "Academic & Research",
            "base_rate": 0.20,
            "weekday_peak_hours": [9, 10, 11, 12, 13, 14, 15],
            "weekend_factor": 0.15,
            "volatility": 0.08
        }
    ]

    weather_types = ["Clear", "Sunny", "Cloudy", "Rainy", "Overcast"]
    weather_weights = [0.45, 0.25, 0.15, 0.10, 0.05]

    start_date = datetime.now() - timedelta(days=num_days)
    records = []

    np.random.seed(42)
    random.seed(42)

    for loc in locations:
        cap = loc["capacity"]
        loc_id = loc["location_id"]
        loc_name = loc["location_name"]
        
        for d in range(num_days):
            current_day = start_date + timedelta(days=d)
            day_of_week = current_day.weekday() # 0 = Monday, 6 = Sunday
            is_weekend = 1 if day_of_week in [5, 6] else 0
            
            # Simulate occasional public holiday (roughly 3-4% of days)
            is_holiday = 1 if (d % 23 == 0) else 0
            
            # Weather for the day with slight diurnal temp variation
            base_temp = 20.0 + 8.0 * np.sin(2 * np.pi * d / 365) + np.random.uniform(-3, 3)
            day_weather = np.random.choice(weather_types, p=weather_weights)
            
            # Nearby special event (sports, concert, festival)
            has_event = 1 if (is_weekend and np.random.rand() < 0.20) or (not is_weekend and np.random.rand() < 0.05) else 0
            
            # Half-hour intervals across 24 hours
            for hour in range(24):
                for minute in [0, 30]:
                    timestamp = current_day.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    time_decimal = hour + minute / 60.0
                    
                    # Hourly temperature curve
                    temp = round(base_temp + 5.0 * np.sin((time_decimal - 6) / 24 * 2 * np.pi), 1)
                    
                    # Peak hour indicator
                    is_peak = 1 if hour in loc["weekday_peak_hours"] else 0
                    
                    # Base occupancy calculation depending on location type
                    if is_weekend:
                        occ_factor = loc["base_rate"] * loc["weekend_factor"]
                        if loc_id == "LOC003": # Mall peak weekend afternoon/evening
                            if 13 <= hour <= 21:
                                occ_factor += 0.55
                            elif 11 <= hour <= 22:
                                occ_factor += 0.35
                        elif loc_id == "LOC004": # Airport
                            occ_factor += 0.15 * np.sin(time_decimal / 24 * 2 * np.pi)
                        elif loc_id in ["LOC001", "LOC002", "LOC005"]:
                            occ_factor = max(0.05, occ_factor + 0.1 * np.sin(time_decimal / 24 * 2 * np.pi))
                    else: # Weekday
                        occ_factor = loc["base_rate"]
                        if is_peak:
                            occ_factor += 0.45
                        elif 9 <= hour <= 17:
                            occ_factor += 0.30
                        elif 6 <= hour <= 22:
                            occ_factor += 0.15
                        else:
                            occ_factor = max(0.05, occ_factor * 0.4)
                            
                        # Academic campus drops sharply after 5 PM
                        if loc_id == "LOC005" and hour >= 17:
                            occ_factor *= 0.25
                            
                        # Commercial drops after 7 PM
                        if loc_id == "LOC002" and hour >= 19:
                            occ_factor *= 0.20

                    # Adjustments
                    if has_event:
                        occ_factor += 0.18
                    if day_weather == "Rainy":
                        if loc_id == "LOC003": # Mall gets more visitors in rain
                            occ_factor += 0.08
                        else:
                            occ_factor -= 0.05
                    if is_holiday:
                        if loc_id in ["LOC002", "LOC005"]:
                            occ_factor *= 0.15
                        elif loc_id in ["LOC003", "LOC004"]:
                            occ_factor *= 1.25

                    # Add realistic noise
                    noise = np.random.normal(0, loc["volatility"])
                    final_ratio = np.clip(occ_factor + noise, 0.02, 0.98)
                    
                    occupied = int(round(final_ratio * cap))
                    occupied = max(0, min(cap, occupied))
                    available = cap - occupied
                    occ_pct = round((occupied / cap) * 100, 2)
                    
                    demand_level = "Low"
                    if occ_pct >= 75:
                        demand_level = "High"
                    elif occ_pct >= 45:
                        demand_level = "Medium"
                        
                    records.append({
                        "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        "location_id": loc_id,
                        "location_name": loc_name,
                        "capacity": cap,
                        "day_of_week": day_of_week,
                        "hour": hour,
                        "minute": minute,
                        "is_weekend": is_weekend,
                        "is_holiday": is_holiday,
                        "temperature_c": temp,
                        "weather_condition": day_weather,
                        "is_peak_hour": is_peak,
                        "nearby_event": has_event,
                        "occupied_spaces": occupied,
                        "available_spaces": available,
                        "occupancy_percentage": occ_pct,
                        "demand_level": demand_level
                    })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Dataset generated successfully at {output_path} with {len(df)} records.")
    
    # Save metadata
    metadata = {
        "dataset_name": "SmartPark AI Historical Sensor Logs",
        "total_records": len(df),
        "total_locations": len(locations),
        "start_date": records[0]["timestamp"],
        "end_date": records[-1]["timestamp"],
        "features": [
            "location_id", "day_of_week", "hour", "minute",
            "is_weekend", "is_holiday", "temperature_c",
            "weather_condition", "is_peak_hour", "nearby_event"
        ],
        "target": "occupied_spaces",
        "locations": locations
    }
    with open("data/dataset_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    return df

if __name__ == "__main__":
    generate_parking_dataset()

