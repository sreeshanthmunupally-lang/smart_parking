import {
  DashboardStats,
  LocationItem,
  SlotItem,
  PredictionResult,
  ReservationItem,
  ModelMetricsResponse
} from "../types";

const API_BASE = "http://localhost:8000/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) {
        if (typeof data.detail === "string") {
          errDetail = data.detail;
        } else if (data.detail.error) {
          errDetail = `${data.detail.error} (${data.detail.solution || ""})`;
        } else {
          errDetail = JSON.stringify(data.detail);
        }
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errDetail);
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; ml_service: string; best_model?: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard`);
  return handleResponse<DashboardStats>(res);
}

export async function fetchLocations(): Promise<LocationItem[]> {
  const res = await fetch(`${API_BASE}/locations`);
  return handleResponse<LocationItem[]>(res);
}

export async function fetchLocationSlots(locationId: string): Promise<SlotItem[]> {
  const res = await fetch(`${API_BASE}/slots/${locationId}`);
  return handleResponse<SlotItem[]>(res);
}

export async function predictParking(payload: {
  location_id: string;
  date: string;
  time: string;
  model_name?: string;
  temperature_c?: number;
  weather_condition?: string;
  nearby_event?: boolean;
}): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse<PredictionResult>(res);
}

export async function fetchReservations(): Promise<ReservationItem[]> {
  const res = await fetch(`${API_BASE}/reservations`);
  return handleResponse<ReservationItem[]>(res);
}

export async function createReservation(payload: {
  slot_id: number;
  location_id: string;
  customer_name: string;
  vehicle_number: string;
  phone?: string;
  email?: string;
  duration_hours?: number;
}): Promise<ReservationItem> {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse<ReservationItem>(res);
}

export async function cancelReservation(reservationId: number): Promise<ReservationItem> {
  const res = await fetch(`${API_BASE}/reservations/${reservationId}`, {
    method: "DELETE"
  });
  return handleResponse<ReservationItem>(res);
}

export async function triggerSimulationTick(locationId?: string, numEvents: number = 3): Promise<{
  status: string;
  message: string;
  updated_slots_count: number;
  simulation_label: string;
}> {
  const res = await fetch(`${API_BASE}/simulation/tick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location_id: locationId, num_events: numEvents })
  });
  return handleResponse(res);
}

export async function resetSimulation(locationId?: string): Promise<{
  status: string;
  message: string;
  updated_slots_count: number;
}> {
  const url = locationId
    ? `${API_BASE}/simulation/reset?location_id=${locationId}`
    : `${API_BASE}/simulation/reset`;
  const res = await fetch(url, { method: "POST" });
  return handleResponse(res);
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  return handleResponse<ModelMetricsResponse>(res);
}

export async function fetchAnalyticsSummary(): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  return handleResponse(res);
}

export async function fetchAboutProject(): Promise<any> {
  const res = await fetch(`${API_BASE}/about`);
  return handleResponse(res);
}

