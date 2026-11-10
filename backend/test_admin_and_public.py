import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app

def run_tests():
    with TestClient(app) as client:
        print("\n--- 1. Testing System Health & Initial Admin Creation ---")
        health = client.get("/api/health")
        assert health.status_code == 200
        print("Health OK:", health.json())

        print("\n--- 2. Testing Public Prediction (Simplified Form: Location, Date, Time only) ---")
        tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
        pred_res = client.post("/api/predict", json={
            "location_id": "LOC001",
            "date": tomorrow,
            "time": "15:00"
        })
        assert pred_res.status_code == 200
        print("Simplified Prediction Result: Occupied =", pred_res.json()["predicted_occupied"], "Model =", pred_res.json()["selected_model"])

        print("\n--- 3. Testing Public Slots Query (Privacy Preserving) ---")
        slots_res = client.get("/api/public/slots/LOC001")
        assert slots_res.status_code == 200
        slots = slots_res.json()
        print(f"Total public bays at LOC001: {len(slots)}")
        avail_slot = next((s for s in slots if s["status"] == "Available"), None)
        assert avail_slot is not None, "At least one slot should be available"
        print(f"Target available bay for booking: {avail_slot['slot_number']} (ID: {avail_slot['id']})")

        print("\n--- 4. Testing Public Customer Reservation Creation ---")
        booking_payload = {
            "location_id": "LOC001",
            "slot_id": avail_slot["id"],
            "customer_name": "Marcus Aurelius",
            "customer_phone": "+1-555-892-1044",
            "customer_email": "marcus@example.com",
            "vehicle_number": "ROME-44",
            "arrival_date": tomorrow,
            "arrival_time": "15:00",
            "duration_hours": 3
        }
        res_booking = client.post("/api/public/reservations", json=booking_payload)
        assert res_booking.status_code == 200
        booking_data = res_booking.json()
        ref = booking_data["booking_reference"]
        print("Booking Created Successfully!")
        print("Reference:", ref)
        print("Customer Phone Masked:", booking_data["customer_phone_masked"])
        print("Slot Number:", booking_data["slot_number"], "Status:", booking_data["status"])

        print("\n--- 5. Testing Concurrency / Overlapping Slot Conflict ---")
        res_conflict = client.post("/api/public/reservations", json=booking_payload)
        assert res_conflict.status_code == 409
        print("Conflict Successfully Blocked (HTTP 409):", res_conflict.json()["detail"])

        print("\n--- 6. Testing Public Booking Lookup ---")
        # Test wrong phone
        res_wrong_lookup = client.post("/api/public/reservations/lookup", json={
            "booking_reference": ref,
            "phone_number": "999-999-9999"
        })
        assert res_wrong_lookup.status_code == 404
        print("Security Check: Unauthorized lookup blocked with 404")

        # Test correct lookup
        res_correct_lookup = client.post("/api/public/reservations/lookup", json={
            "booking_reference": ref,
            "phone_number": "5558921044"
        })
        assert res_correct_lookup.status_code == 200
        print("Lookup Verified:", res_correct_lookup.json()["booking_reference"], "Status:", res_correct_lookup.json()["status"])

        print("\n--- 7. Testing Admin Authentication & Access Control ---")
        # Unauthenticated access to admin stats -> 401
        res_unauth = client.get("/api/admin/stats")
        assert res_unauth.status_code == 401
        print("Security Check: Unauthenticated access blocked with 401")

        # Invalid login
        res_bad_login = client.post("/api/admin/auth/login", json={
            "username": "admin",
            "password": "WrongPassword123"
        })
        assert res_bad_login.status_code == 401
        print("Security Check: Invalid password blocked with 401")

        # Valid login
        res_login = client.post("/api/admin/auth/login", json={
            "username": "admin",
            "password": "Admin@SmartPark2026!"
        })
        assert res_login.status_code == 200
        token = res_login.json()["access_token"]
        print("Admin Login Successful! JWT Issued:", token[:25] + "...")
        headers = {"Authorization": f"Bearer {token}"}

        print("\n--- 8. Testing Admin Stats & Reservation Management ---")
        stats_admin = client.get("/api/admin/stats?period=all", headers=headers)
        assert stats_admin.status_code == 200
        print("Admin Stats (All):", stats_admin.json())
        assert stats_admin.json()["total_reservations"] > 0
        assert stats_admin.json()["confirmed_reservations"] > 0

        # Filter by today
        stats_today = client.get("/api/admin/stats?period=today", headers=headers)
        assert stats_today.status_code == 200
        print("Admin Stats (Today):", stats_today.json()["total_reservations"])

        # Admin reservations list
        res_list = client.get("/api/admin/reservations?limit=10", headers=headers)
        assert res_list.status_code == 200
        print(f"Admin retrieved {len(res_list.json())} reservations")
        found = any(r["booking_reference"] == ref for r in res_list.json())
        assert found, "The newly created public reservation must appear in the admin table"
        print(f"Verified new public booking '{ref}' is present in admin records!")

        # Admin notifications
        notifs = client.get("/api/admin/notifications", headers=headers)
        assert notifs.status_code == 200
        print(f"Admin notifications count: {len(notifs.json())}")
        assert len(notifs.json()) > 0
        print("Latest Notification:", notifs.json()[0]["title"], "-", notifs.json()[0]["message"])

        # CSV Export
        csv_res = client.get("/api/admin/reservations/export/csv", headers=headers)
        assert csv_res.status_code == 200
        assert "Booking Reference" in csv_res.text
        print("CSV Export Successful! First 100 bytes:", csv_res.text[:100].replace("\n", " "))

        print("\n--- 9. Testing Customer Cancellation & Slot Release ---")
        res_cancel = client.post("/api/public/reservations/cancel", json={
            "booking_reference": ref,
            "phone_number": "+1-555-892-1044",
            "reason": "Change of travel plans"
        })
        assert res_cancel.status_code == 200
        assert res_cancel.json()["status"] == "CANCELLED"
        print("Public Customer Cancellation Verified: Status =", res_cancel.json()["status"])

        # Verify slot is released back to Available
        slots_after = client.get("/api/public/slots/LOC001").json()
        slot_status = next(s["status"] for s in slots_after if s["id"] == avail_slot["id"])
        print(f"Bay {avail_slot['slot_number']} status after cancellation: {slot_status}")
        assert slot_status == "Available", f"Slot should be released back to Available, got {slot_status}"

        # Verify Admin stats reflect cancellation
        stats_after = client.get("/api/admin/stats?period=all", headers=headers).json()
        print("Admin Cancelled Count:", stats_after["cancelled_reservations"])
        assert stats_after["cancelled_reservations"] >= 1

        print("\n=======================================================")
        print("ALL PUBLIC & ADMIN WORKFLOW TESTS PASSED PERFECTLY!")
        print("=======================================================")

if __name__ == "__main__":
    run_tests()
