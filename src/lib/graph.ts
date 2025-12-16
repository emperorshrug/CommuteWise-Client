// =========================================================================================
// GRAPH DATA - MANUAL PILOT DATA
// PURPOSE: PROVIDES HARDCODED LOCATIONS FOR TERMINALS AND STOPS
// CONTEXT: USED FOR BARANGAY TANDANG SORA PILOT. MAPPED TO MAPBOX STREETS V12.
// =========================================================================================

import type { Terminal, TransportStop } from "../types/types";

// MANUAL DATA: Pilot Area (Tandang Sora / QC)
// We use the IDs to link them to the routing algorithm later.

export const TERMINALS_DATA: Terminal[] = [
  {
    id: 1,
    name: "Tandang Sora Jeepney Terminal",
    address: "Tandang Sora Ave, Culliat, Quezon City",
    vehicle_type: "jeepney",
    lat: 14.676,
    lng: 121.0437,
    rating: 4.5,
    rating_count: 128,
    description:
      "Main terminal near the market. Routes to Visayas Ave and QC Hall.",
    routes: [
      {
        id: "r1",
        name: "Tandang Sora -> Quezon City Hall",
        distance_km: 4.2,
        eta_mins: 25,
        fare_regular: 13.0,
        fare_discounted: 11.0,
        stops: [
          { id: 101, name: "Tandang Sora Terminal", type: "start" },
          { id: 102, name: "Culiat Intersection", type: "waypoint" },
          { id: 103, name: "Central Avenue", type: "waypoint" },
          { id: 104, name: "Housing / Puregold", type: "waypoint" },
          { id: 105, name: "Quezon City Hall", type: "end" },
        ],
      },
      {
        id: "r2",
        name: "Tandang Sora -> Visayas Avenue",
        distance_km: 2.5,
        eta_mins: 15,
        fare_regular: 13.0,
        fare_discounted: 11.0,
        stops: [
          { id: 201, name: "Tandang Sora Terminal", type: "start" },
          { id: 202, name: "Sanville Subdivision", type: "waypoint" },
          { id: 203, name: "7-Eleven Visayas", type: "waypoint" },
          { id: 204, name: "Wilcon City Center", type: "end" },
        ],
      },
    ],
    reviews: [
      {
        id: "rev1",
        user_display_name: "CommuterJuan",
        rating: 5,
        comment: "Organized queueing system even during rush hour.",
        date_posted: "2025-12-10",
        upvotes: 15,
        downvotes: 1,
      },
      {
        id: "rev2",
        user_display_name: "MariaClara_99",
        rating: 4,
        comment: "Good terminal but muddy when it rains.",
        date_posted: "2025-12-12",
        upvotes: 8,
        downvotes: 0,
      },
    ],
  },
  // ... (Other terminals can remain basic for now)
  {
    id: 2,
    name: "Visayas Ave Tricycle TODA",
    address: "Visayas Ave cor. T. Sora, QC",
    vehicle_type: "tricycle",
    lat: 14.672,
    lng: 121.048,
    rating: 4.2,
    rating_count: 54,
    description: "Green tricycles.",
    routes: [],
    reviews: [],
  },
  {
    id: 3,
    name: "Philcoa Jeepney Stop",
    address: "Commonwealth Ave, QC",
    vehicle_type: "jeepney",
    lat: 14.6515,
    lng: 121.0493,
    rating: 4.8,
    rating_count: 312,
    description: "Major hub.",
    routes: [],
    reviews: [],
  },
  {
    id: 4,
    name: "Culiat E-Jeep Station",
    address: "Luzon Ave, Culiat, QC",
    vehicle_type: "e-jeep",
    lat: 14.665,
    lng: 121.055,
    rating: 4.0,
    rating_count: 20,
    description: "Modern AC jeeps.",
    routes: [],
    reviews: [],
  },
];

// MANUAL DATA: STOPS ALONG THE ROUTES
// CONTEXT: COORDINATES ARE MANUALLY SNAPPED TO ROAD INTERSECTIONS.
// UPDATE: NOW SUPPORTS MULTIPLE VEHICLE TYPES PER STOP.
export const STOPS_DATA: TransportStop[] = [
  // --- VISAYAS AVE (MAINLY JEEPS) ---
  {
    id: 101,
    name: "Sanville Subdivision",
    vehicle_types: ["jeepney"], // SINGLE MODE
    lat: 14.6715,
    lng: 121.0452,
  },
  {
    id: 102,
    name: "Centralville / 7-Eleven",
    vehicle_types: ["jeepney"],
    lat: 14.6685,
    lng: 121.0468,
  },
  {
    id: 103,
    name: "Wilcon City Center",
    vehicle_types: ["jeepney", "bus"], // EXAMPLE: SERVES BOTH JEEP AND BUS
    lat: 14.6642,
    lng: 121.0495,
  },

  // --- TANDANG SORA (MIXED USE) ---
  {
    id: 201,
    name: "Palengke (Wet Market)",
    vehicle_types: ["tricycle", "jeepney"], // DUAL MODE HUB
    lat: 14.6755,
    lng: 121.043,
  },
  {
    id: 202,
    name: "St. James College",
    vehicle_types: ["tricycle"],
    lat: 14.674,
    lng: 121.0415,
  },
  {
    id: 203,
    name: "Crossroad / Shell",
    vehicle_types: ["jeepney", "e-jeep"], // JEEP AND E-JEEP STOP
    lat: 14.6765,
    lng: 121.0445,
  },
];
