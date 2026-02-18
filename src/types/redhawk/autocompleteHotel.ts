// Hotel
export interface Hotel {
  id: string;
  name: string;
  region_id: number;
}

// Region
export interface Region {
  id: number;
  name: string;
  type: "City" | string;
  country_code: string;
}

// Data wrapper
export interface SearchData {
  hotels: Hotel[];
  regions: Region[];
}

// Debug request
export interface DebugRequest {
  query: string;
  language: string;
}

// Debug info
export interface DebugInfo {
  request: DebugRequest;
  key_id: number;
}

// Root API response
export interface HotelAutoCompleteResponse {
  data: SearchData;
  debug: DebugInfo;
  status: "ok" | "error";
  error: string | null;
}
