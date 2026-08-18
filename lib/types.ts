export type PlaceCategory = string; // Define later based on Maps Place API

export interface Place {
  local_id?: string;
  name: string;
  maps_place_id: string;
  maps_coords: string;
  address: string;
  opening_time?: string; // e.g. "08:00 - 17:00"
  rating: number;
  rate_count: number;
  introduction: string;
  category: string;
  is_outdoor: boolean;
  suggested_stay_time_secs?: number;
}

export interface ItineraryItem extends Place {
  start_time: string; // UTC timestamp or ISO string
  end_time: string;
  transit_instruction?: string;
}

export interface Itinerary {
  id: string; // uuid
  name: string;
  Start_DateTime: string; // UTC ISO String
  City: string;
  items: ItineraryItem[];
  transport: "CAR" | "BUS" | "BIKE";
}

export interface WeatherWarning {
  hours: number;
  condition: "HEAT" | "RAIN" | "UV";
}
