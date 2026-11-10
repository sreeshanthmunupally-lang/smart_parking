export interface LocationItem {
  location_id: string;
  name: string;
  address: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancy_percentage: number;
  demand_level: "Low" | "Medium" | "High";
  type: string;
  hourly_rate: number;
  latitude?: number;
  longitude?: number;
}

export interface HourlyTrend {
  hour: string;
  occupied: number;
  available: number;
  occupancy_rate: number;
}

export interface DashboardStats {
  total_capacity: number;
  total_occupied: number;
  total_available: number;
  overall_occupancy_percentage: number;
  overall_demand_status: "Low" | "Medium" | "High";
  active_reservations_count: number;
  total_locations_count: number;
  locations: LocationItem[];
  hourly_trends: HourlyTrend[];
  simulation_mode: boolean;
  model_status: {
    is_ready: boolean;
    best_model?: string;
    models_available?: string[];
    missing_files?: string[];
  };
}

export interface ReservationInfo {
  id: number;
  reservation_code: string;
  customer_name: string;
  vehicle_number: string;
  start_time: string;
  end_time?: string;
  status: string;
}

export interface SlotItem {
  id: number;
  location_id: string;
  slot_number: string;
  floor: string;
  zone: string;
  slot_type: "Standard" | "EV Charging" | "Accessible" | "VIP";
  status: "Available" | "Occupied" | "Reserved";
  last_status_change: string;
  current_reservation?: ReservationInfo | null;
}

export interface SingleModelPrediction {
  model_name: string;
  predicted_occupied: number;
  predicted_available: number;
  occupancy_percentage: number;
  demand_level: "Low" | "Medium" | "High";
  mae: number;
  rmse: number;
  r2_score: number;
}

export interface PredictionResult {
  location_id: string;
  location_name: string;
  total_capacity: number;
  target_timestamp: string;
  day_of_week_name: string;
  is_weekend: boolean;
  is_peak_hour: boolean;
  weather_condition: string;
  temperature_c: number;
  selected_model: string;
  predicted_occupied: number;
  predicted_available: number;
  occupancy_percentage: number;
  demand_level: "Low" | "Medium" | "High";
  model_metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
    mape: number;
    training_time_seconds: number;
    filename: string;
    description: string;
  };
  all_models_comparison: Record<string, SingleModelPrediction>;
  recommendation: string;
}

export interface ReservationItem {
  id: number;
  reservation_code: string;
  slot_id: number;
  slot_number: string;
  location_id: string;
  location_name: string;
  customer_name: string;
  vehicle_number: string;
  phone?: string;
  email?: string;
  start_time: string;
  end_time?: string;
  status: "Active" | "Cancelled" | "Completed";
  created_at: string;
}

export interface ModelMetricEntry {
  mae: number;
  rmse: number;
  r2_score: number;
  mape: number;
  training_time_seconds: number;
  filename: string;
  description: string;
}

export interface FeatureImportanceEntry {
  feature: string;
  importance: number;
}

export interface SampleChartEntry {
  index: number;
  timestamp: string;
  location: string;
  actual: number;
  linear_regression: number;
  decision_tree: number;
  random_forest: number;
}

export interface ModelMetricsResponse {
  status: string;
  is_ready: boolean;
  trained_at?: string;
  dataset_records?: number;
  train_samples?: number;
  test_samples?: number;
  features?: string[];
  transformed_features?: string[];
  target?: string;
  best_model_name?: string;
  models?: Record<string, ModelMetricEntry>;
  feature_importances?: Record<string, FeatureImportanceEntry[]>;
  sample_chart_data?: SampleChartEntry[];
  residual_distribution?: Array<{ bin: string; count: number }>;
  missing_files?: string[];
  message?: string;
}
