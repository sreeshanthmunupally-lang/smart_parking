import sys
import os

# Add root directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app

def test_endpoints():
    with TestClient(app) as client:
        # 1. Health
        res = client.get("/api/health")
        print("Health Check:", res.status_code, res.json())
        assert res.status_code == 200

        # 2. Dashboard
        res = client.get("/api/dashboard")
        print("Dashboard Check:", res.status_code, "Total Capacity:", res.json()["total_capacity"])
        assert res.status_code == 200
        assert res.json()["total_capacity"] > 0

        # 3. Predict with Best Model
        res = client.post("/api/predict", json={
            "location_id": "LOC001",
            "date": "2026-11-20",
            "time": "14:30",
            "model_name": "Best Model",
            "weather_condition": "Clear",
            "temperature_c": 22.5,
            "nearby_event": False
        })
        print("Prediction (Best Model):", res.status_code, "Occupied:", res.json()["predicted_occupied"], "Model:", res.json()["selected_model"])
        assert res.status_code == 200

        # 4. Predict with Linear Regression
        res = client.post("/api/predict", json={
            "location_id": "LOC002",
            "date": "2026-11-20",
            "time": "10:00",
            "model_name": "Linear Regression"
        })
        print("Prediction (Linear Regression):", res.status_code, "Occupied:", res.json()["predicted_occupied"], "Model:", res.json()["selected_model"])
        assert res.status_code == 200

        # 5. Slots
        res = client.get("/api/slots/LOC001")
        print("Slots Check (LOC001):", res.status_code, "Count:", len(res.json()))
        assert res.status_code == 200
        assert len(res.json()) > 0
        avail_slot = next((s for s in res.json() if s["status"] == "Available"), None)

        # 6. Reservation Simulation
        if avail_slot:
            res = client.post("/api/reservations", json={
                "slot_id": avail_slot["id"],
                "location_id": "LOC001",
                "customer_name": "Test Driver",
                "vehicle_number": "TEST-1234",
                "phone": "+1-555-0199",
                "email": "test@example.com",
                "duration_hours": 2
            })
            print("Create Reservation:", res.status_code, "Code:", res.json()["reservation_code"])
            assert res.status_code == 200
            res_id = res.json()["id"]

            # Cancel Reservation
            res_cancel = client.delete(f"/api/reservations/{res_id}")
            print("Cancel Reservation:", res_cancel.status_code, "Status:", res_cancel.json()["status"])
            assert res_cancel.status_code == 200

        # 7. Metrics
        res = client.get("/api/metrics")
        print("ML Metrics Check:", res.status_code, "Best Model:", res.json()["best_model_name"])
        assert res.status_code == 200

        # 8. Analytics
        res = client.get("/api/analytics/summary")
        print("Analytics Check:", res.status_code, "Hourly points:", len(res.json()["hourly_occupancy"]))
        assert res.status_code == 200

        # 9. Simulation Tick
        res = client.post("/api/simulation/tick", json={"location_id": "LOC001", "num_events": 2})
        print("Simulation Tick:", res.status_code, res.json()["message"])
        assert res.status_code == 200

        print("\nAll Backend Tests Passed Successfully!")

if __name__ == "__main__":
    test_endpoints()

