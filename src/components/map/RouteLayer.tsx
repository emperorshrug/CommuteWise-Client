// =========================================================================================
// COMPONENT: ROUTE LAYER
// PURPOSE: RENDERS MULTI-COLORED ROUTE POLYLINES ON THE MAP
// COLORS: WALK = SKY BLUE, RIDE = VEHICLE COLOR (YELLOW/GREEN/PURPLE/BLUE)
// =========================================================================================

import { Source, Layer } from "react-map-gl";
import { useAppStore } from "../../stores/useAppStore";
import type { CalculatedRoute } from "../../types/route";

export default function RouteLayer() {
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const activeNavigation = useAppStore((state) => state.activeNavigation);
  const navPhase = useAppStore((state) => state.navPhase);

  if (!selectedRoute && !activeNavigation.route) {
    return null;
  }

  const route = selectedRoute || activeNavigation.route;
  if (!route) return null;

  // IN NAVIGATION MODE, SHOW TRAVELED AND REMAINING PATHS SEPARATELY
  const isNavigationMode = navPhase === "navigation" && activeNavigation.isActive;

  // BUILD GEOJSON FOR EACH SEGMENT WITH DIFFERENT COLORS
  const segmentLayers: JSX.Element[] = [];

  // RENDER TRAVELED PATH (GRAY) IF IN NAVIGATION MODE
  if (isNavigationMode && activeNavigation.traveledPath) {
    const traveledGeojson = {
      type: "Feature" as const,
      geometry: activeNavigation.traveledPath,
      properties: { type: "traveled" },
    };

    segmentLayers.push(
      <Source key="route-traveled" type="geojson" data={traveledGeojson}>
        <Layer
          id="route-traveled"
          type="line"
          paint={{
            "line-color": "#cbd5e1", // GRAY-300 (TRAVELED)
            "line-width": 6,
            "line-opacity": 0.7,
          }}
        />
      </Source>
    );
  }

  route.segments.forEach((segment, index) => {
    // IN NAVIGATION MODE, ONLY SHOW REMAINING SEGMENTS
    if (isNavigationMode && index < activeNavigation.currentSegmentIndex) {
      return; // SKIP ALREADY COMPLETED SEGMENTS
    }

    const color =
      segment.type === "walk"
        ? "#38bdf8" // SKY-400 (WALKING)
        : segment.vehicleType === "jeepney"
        ? "#eab308" // YELLOW-500 (JEEP)
        : segment.vehicleType === "tricycle"
        ? "#22c55e" // GREEN-500 (TIKE)
        : segment.vehicleType === "e-jeep"
        ? "#a855f7" // PURPLE-500 (E-JEEP)
        : segment.vehicleType === "bus"
        ? "#1d4ed8" // BLUE-700 (BUS)
        : "#64748b"; // SLATE-500 (DEFAULT)

    // DASHED LINE FOR WALKING, SOLID FOR RIDING
    const linePattern = segment.type === "walk" ? "dash" : "solid";

    const geojson = {
      type: "Feature" as const,
      geometry: segment.geometry,
      properties: {
        segmentIndex: index,
        segmentType: segment.type,
        color,
      },
    };

    segmentLayers.push(
      <Source key={`route-segment-${index}`} type="geojson" data={geojson}>
        <Layer
          id={`route-segment-${index}`}
          type="line"
          paint={{
            "line-color": color,
            "line-width": segment.type === "walk" ? 4 : 6,
            "line-opacity": 0.8,
            ...(segment.type === "walk"
              ? {
                  "line-dasharray": [2, 2],
                }
              : {}),
          }}
        />
      </Source>
    );
  });

  return <>{segmentLayers}</>;
}

