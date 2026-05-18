export interface AnalyzeResponse {
  status: "OK" | "NON_ARABLE" | "ERROR" | string;
  message?: string;
  reason?: string;
  input?: { lat: number; lon: number; land_use: string };
  factors?: {
    rainfall_mm?: number;
    slope_percent?: number;
    soil_depth?: string;
    drainage?: string;
    land_use?: string;
  };
  mechanical_measures?: {
    mode?: string;
    measures?: string[];
  };
  erosion_risk?: {
    level?: string;
    score?: number;
    method?: string;
  };
}

export interface HistoryItem {
  id: number;
  latitude: number;
  longitude: number;
  land_use: string;
  backend_status: string | null;
  erosion_risk_level: string | null;
  created_at: string;
}
