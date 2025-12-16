// =========================================================================================
// TYPES DEFINITION - UPDATED FOR ROUTE STOPS & REPORTING
// PURPOSE: ADDS 'stops' ARRAY TO ROUTE INFO.
// =========================================================================================

export type VehicleType = "jeepney" | "tricycle" | "e-jeep" | "bus";

export interface RouteStop {
  id: number;
  name: string;
  type: "start" | "waypoint" | "end"; // Green, Gray, Red logic
}

export interface RouteInfo {
  id: string;
  name: string;
  distance_km: number;
  eta_mins: number;
  fare_regular: number;
  fare_discounted: number;
  stops: RouteStop[]; // NEW: List of stops for this route
}

export interface Review {
  id: string;
  user_display_name: string;
  rating: number;
  comment: string;
  date_posted: string;
  upvotes: number;
  downvotes: number;
}

export interface Terminal {
  id: number;
  name: string;
  address: string;
  vehicle_type: VehicleType;
  lat: number;
  lng: number;
  rating: number;
  rating_count: number;
  description: string;
  routes: RouteInfo[];
  reviews: Review[];
}

export interface TransportStop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  vehicle_types: VehicleType[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  heading: number | null;
}
