// =========================================================================================
// MAPBOX SERVICE: WALKING ROUTE CALCULATIONS
// PURPOSE: WRAPS MAPBOX DIRECTIONS API FOR WALKING ROUTE CALCULATION
// API: MAPBOX DIRECTIONS API V5
// =========================================================================================

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// WALKING ROUTE RESULT FROM MAPBOX API
export interface MapboxWalkingRoute {
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat] PAIRS
  };
  distance: number; // DISTANCE IN METERS
  duration: number; // DURATION IN SECONDS
  legs: Array<{
    distance: number;
    duration: number;
    steps: Array<{
      distance: number;
      duration: number;
      instruction?: string;
      geometry: {
        coordinates: [number, number][];
      };
    }>;
  }>;
}

// MAPBOX DIRECTIONS API RESPONSE
interface MapboxDirectionsResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
    };
    distance: number;
    duration: number;
    legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        maneuver: {
          instruction: string;
        };
        geometry: {
          coordinates: [number, number][];
        };
      }>;
    }>;
  }>;
  code: string;
  message?: string;
}

/**
 * CALCULATE WALKING ROUTE: GETS WALKING PATH BETWEEN TWO POINTS
 * @param from - Starting coordinates [lng, lat]
 * @param to - Ending coordinates [lng, lat]
 * @returns Walking route with geometry, distance, and duration
 */
export async function calculateWalkingRoute(
  from: [number, number], // [lng, lat]
  to: [number, number] // [lng, lat]
): Promise<MapboxWalkingRoute | null> {
  if (!MAPBOX_TOKEN) {
    console.error("[MAPBOX ERROR]: MAPBOX_TOKEN is missing");
    return null;
  }

  try {
    // MAPBOX DIRECTIONS API URL
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${from[0]},${from[1]};${to[0]},${to[1]}?access_token=${MAPBOX_TOKEN}&geometries=geojson&steps=true&overview=full`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API HTTP error: ${response.status}`);
    }

    const data: MapboxDirectionsResponse = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn("[MAPBOX WARNING]: No route found", data.message);
      return null;
    }

    const route = data.routes[0];

    return {
      geometry: {
        type: "LineString",
        coordinates: route.geometry.coordinates as [number, number][],
      },
      distance: route.distance, // METERS
      duration: route.duration, // SECONDS
      legs: route.legs.map((leg) => ({
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map((step) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.maneuver.instruction,
          geometry: {
            coordinates: step.geometry.coordinates as [number, number][],
          },
        })),
      })),
    };
  } catch (error) {
    console.error("[MAPBOX ERROR]:", error);
    return null;
  }
}

/**
 * CALCULATE MULTIPLE WALKING ROUTES: FOR ROUTES WITH WAYPOINTS
 * @param coordinates - Array of [lng, lat] coordinates (start, waypoints..., end)
 * @returns Walking route with waypoints
 */
export async function calculateWalkingRouteWithWaypoints(
  coordinates: [number, number][] // [lng, lat] ARRAY
): Promise<MapboxWalkingRoute | null> {
  if (!MAPBOX_TOKEN) {
    console.error("[MAPBOX ERROR]: MAPBOX_TOKEN is missing");
    return null;
  }

  if (coordinates.length < 2) {
    return null;
  }

  try {
    // BUILD WAYPOINTS STRING FOR MAPBOX API
    const waypointsString = coordinates
      .map((coord) => `${coord[0]},${coord[1]}`)
      .join(";");

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${waypointsString}?access_token=${MAPBOX_TOKEN}&geometries=geojson&steps=true&overview=full`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API HTTP error: ${response.status}`);
    }

    const data: MapboxDirectionsResponse = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn("[MAPBOX WARNING]: No route found", data.message);
      return null;
    }

    const route = data.routes[0];

    return {
      geometry: {
        type: "LineString",
        coordinates: route.geometry.coordinates as [number, number][],
      },
      distance: route.distance,
      duration: route.duration,
      legs: route.legs.map((leg) => ({
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map((step) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.maneuver.instruction,
          geometry: {
            coordinates: step.geometry.coordinates as [number, number][],
          },
        })),
      })),
    };
  } catch (error) {
    console.error("[MAPBOX ERROR]:", error);
    return null;
  }
}

/**
 * CONVERT METERS TO KILOMETERS
 */
export function metersToKm(meters: number): number {
  return meters / 1000;
}

/**
 * CONVERT SECONDS TO MINUTES
 */
export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}
