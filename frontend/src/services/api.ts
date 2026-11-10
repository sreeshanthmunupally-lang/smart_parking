import {
  DashboardStats,
  LocationItem,
  SlotItem,
  PredictionResult,
  ReservationItem,
  ModelMetricsResponse,
  PublicReservationPayload,
  PublicReservation,
  AdminUser,
  AdminStats,
  AdminReservation,
  AdminNotification
} from "../types";

const API_BASE = "http://localhost:8000/api";

// Token storage helpers
const ADMIN_TOKEN_KEY = "smartpark_admin_jwt";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

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
      // ignore parse error
    }
    throw new Error(errDetail);
  }
  return res.json();
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export async function fetchPublicSlots(locationId: string): Promise<SlotItem[]> {
  const res = await fetch(`${API_BASE}/public/slots/${locationId}`);
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

// ---------------- PUBLIC CUSTOMER RESERVATIONS ----------------
export async function createPublicReservation(payload: PublicReservationPayload): Promise<PublicReservation> {
  const res = await fetch(`${API_BASE}/public/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse<PublicReservation>(res);
}

export async function lookupPublicReservation(bookingReference: string, phoneNumber: string): Promise<PublicReservation> {
  const res = await fetch(`${API_BASE}/public/reservations/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_reference: bookingReference, phone_number: phoneNumber })
  });
  return handleResponse<PublicReservation>(res);
}

export async function cancelPublicReservation(bookingReference: string, phoneNumber: string, reason?: string): Promise<PublicReservation> {
  const res = await fetch(`${API_BASE}/public/reservations/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_reference: bookingReference, phone_number: phoneNumber, reason })
  });
  return handleResponse<PublicReservation>(res);
}

// ---------------- ADMIN ENDPOINTS ----------------
export async function adminLogin(username: string, password: string): Promise<{ access_token: string; admin: AdminUser }> {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await handleResponse<{ access_token: string; admin: AdminUser }>(res);
  setAdminToken(data.access_token);
  return data;
}

export async function fetchAdminProfile(): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/admin/auth/me`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResponse<AdminUser>(res);
}

export async function fetchAdminStats(period: string = "all", startDate?: string, endDate?: string): Promise<AdminStats> {
  let url = `${API_BASE}/admin/stats?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;

  const res = await fetch(url, {
    headers: { ...getAuthHeaders() }
  });
  return handleResponse<AdminStats>(res);
}

export async function fetchAdminReservations(
  search?: string,
  locationId?: string,
  statusFilter?: string,
  sortOrder: string = "newest",
  limit: number = 100
): Promise<AdminReservation[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (locationId) params.append("location_id", locationId);
  if (statusFilter) params.append("status_filter", statusFilter);
  params.append("sort_order", sortOrder);
  params.append("limit", limit.toString());

  const res = await fetch(`${API_BASE}/admin/reservations?${params.toString()}`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResponse<AdminReservation[]>(res);
}

export async function updateAdminReservationStatus(id: number, status: string, reason?: string): Promise<AdminReservation> {
  const res = await fetch(`${API_BASE}/admin/reservations/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ status, reason })
  });
  return handleResponse<AdminReservation>(res);
}

export function getAdminExportCsvUrl(statusFilter?: string, locationId?: string): string {
  const token = getAdminToken() || "";
  let url = `${API_BASE}/admin/reservations/export/csv?token=${token}`;
  if (statusFilter) url += `&status_filter=${statusFilter}`;
  if (locationId) url += `&location_id=${locationId}`;
  return url;
}

export async function downloadAdminReservationsCsv(statusFilter?: string, locationId?: string): Promise<Blob> {
  let url = `${API_BASE}/admin/reservations/export/csv`;
  const params = new URLSearchParams();
  if (statusFilter) params.append("status_filter", statusFilter);
  if (locationId) params.append("location_id", locationId);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) {
    throw new Error(`CSV export failed: ${res.statusText}`);
  }
  return res.blob();
}

export async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  const res = await fetch(`${API_BASE}/admin/notifications`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResponse<AdminNotification[]>(res);
}

export async function markAdminNotificationRead(id: number): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/admin/notifications/${id}/read`, {
    method: "POST",
    headers: { ...getAuthHeaders() }
  });
  return handleResponse(res);
}

export async function markAllAdminNotificationsRead(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/admin/notifications/mark-all-read`, {
    method: "POST",
    headers: { ...getAuthHeaders() }
  });
  return handleResponse(res);
}

// ---------------- EXISTING TELEMETRY / SIMULATION ----------------
export async function fetchReservations(): Promise<ReservationItem[]> {
  const res = await fetch(`${API_BASE}/reservations`);
  return handleResponse<ReservationItem[]>(res);
}

export async function createReservation(payload: any): Promise<ReservationItem> {
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
