// =========================================================================================
// HOOK: ROUTE TRACKING
// PURPOSE: TRACKS USER PROGRESS ALONG ROUTE AND UPDATES TRAVELED/REMAINING PATHS
// FEATURES: GPS Tracking, Path Splitting, Progress Calculation
// THROTTLING: UPDATES MAX ONCE EVERY 3 SECONDS TO PREVENT EXCESSIVE STATE UPDATES
// =========================================================================================

import { useEffect, useRef } from "react";
import * as turf from "@turf/turf";
import { useAppStore } from "../stores/useAppStore";
import type { ActiveNavigationState } from "../types/route";

// THRESHOLD DISTANCE IN METERS FOR CONSIDERING USER AT A WAYPOINT
const WAYPOINT_THRESHOLD_M = 50;
// THROTTLE: MAXIMUM UPDATE FREQUENCY (3 SECONDS) TO PREVENT EXCESSIVE API CALLS AND STATE UPDATES
const THROTTLE_MS = 3000;

/**
 * USE ROUTE TRACKING: TRACKS USER POSITION ALONG ACTIVE ROUTE
 */
export function useRouteTracking() {
  const userLocation = useAppStore((state) => state.userLocation);
  const activeNavigation = useAppStore((state) => state.activeNavigation);
  const setActiveNavigation = useAppStore((state) => state.setActiveNavigation);
  const lastTrackedPointRef = useRef<[number, number] | null>(null);
  const lastUpdateRef = useRef<number>(0); // TRACK LAST UPDATE TIME FOR THROTTLING

  useEffect(() => {
    if (
      !activeNavigation.isActive ||
      !activeNavigation.route ||
      !userLocation
    ) {
      return;
    }

    // THROTTLE: ONLY UPDATE IF 3 SECONDS HAVE PASSED SINCE LAST UPDATE
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }

    const route = activeNavigation.route;
    const userPoint = turf.point([userLocation.lng, userLocation.lat]);

    // BUILD COMPLETE ROUTE GEOMETRY FROM ALL SEGMENTS
    const allCoordinates: [number, number][] = [];
    route.segments.forEach((segment) => {
      segment.geometry.coordinates.forEach((coord) => {
        allCoordinates.push(coord);
      });
    });

    if (allCoordinates.length === 0) return;

    // FIND NEAREST POINT ON ROUTE TO USER LOCATION
    const routeLine = turf.lineString(allCoordinates);
    const nearestPoint = turf.nearestPointOnLine(routeLine, userPoint, {
      units: "meters",
    });

    const distanceToRoute = nearestPoint.properties.dist || Infinity;

    // IF USER IS TOO FAR FROM ROUTE (>200M), DON'T UPDATE
    if (distanceToRoute > 200) {
      return;
    }

    // FIND INDEX OF NEAREST POINT IN COORDINATES ARRAY
    let nearestIndex = 0;
    let minDistance = Infinity;

    allCoordinates.forEach((coord, index) => {
      const coordPoint = turf.point(coord);
      const distance = turf.distance(userPoint, coordPoint, {
        units: "meters",
      });
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    // SPLIT ROUTE INTO TRAVELED AND REMAINING PARTS
    const traveledCoordinates: [number, number][] = allCoordinates.slice(
      0,
      nearestIndex + 1
    );

    // ADD CURRENT USER POSITION TO TRAVELED PATH
    traveledCoordinates.push([userLocation.lng, userLocation.lat]);

    // UPDATE TRAVELED PATH
    const traveledPath = {
      type: "LineString" as const,
      coordinates: traveledCoordinates,
    };

    // BUILD REMAINING ROUTE (COPY OF ORIGINAL WITH UPDATED SEGMENTS)
    const remainingRoute = { ...route };
    // RECALCULATE SEGMENT INDICES BASED ON PROGRESS
    const currentSegmentIndex = calculateCurrentSegmentIndex(
      route,
      nearestIndex
    );

    // UPDATE ACTIVE NAVIGATION STATE
    setActiveNavigation({
      traveledPath,
      currentSegmentIndex,
      remainingPath: remainingRoute,
    });

    // SAVE LAST TRACKED POINT
    lastTrackedPointRef.current = [userLocation.lng, userLocation.lat];

    // CHECK IF USER REACHED END OF ROUTE
    const distanceToEnd = turf.distance(
      userPoint,
      turf.point(allCoordinates[allCoordinates.length - 1]),
      { units: "meters" }
    );

    if (distanceToEnd < WAYPOINT_THRESHOLD_M) {
      // ROUTE COMPLETED - RESET NAVIGATION
      setActiveNavigation({
        isActive: false,
        currentSegmentIndex: route.segments.length - 1,
      });
    }

    lastUpdateRef.current = now; // UPDATE LAST UPDATE TIME
  }, [
    userLocation,
    activeNavigation.isActive,
    activeNavigation.route,
    setActiveNavigation,
  ]);
}

/**
 * CALCULATE CURRENT SEGMENT INDEX: DETERMINES WHICH SEGMENT USER IS CURRENTLY ON
 */
function calculateCurrentSegmentIndex(
  route: ActiveNavigationState["route"],
  currentCoordinateIndex: number
): number {
  if (!route) return 0;

  let coordinateCount = 0;
  for (let i = 0; i < route.segments.length; i++) {
    const segmentCoordCount = route.segments[i].geometry.coordinates.length;
    coordinateCount += segmentCoordCount;

    if (currentCoordinateIndex < coordinateCount) {
      return i;
    }
  }

  return route.segments.length - 1;
}
