// =========================================================================================
// MAP CANVAS - REVERTED & CLEANED
// STATUS: STABLE PRODUCTION VERSION
// 1. REMOVED ROUTELAYER IMPORT/USAGE.
// 2. KEPT STRICT GESTURE SETTINGS TO MINIMIZE ZOOM BUGS.
// 3. INCLUDES TERMINAL DETAILS OVERLAY.
// =========================================================================================

import { useState, useRef, useEffect } from "react";
import Map, { type MapRef, type ViewStateChangeEvent } from "react-map-gl";
import type { ViewState } from "react-map-gl";
import { Crosshair } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

// COMPONENTS
import TerminalMarkers from "./TerminalMarkers";
import UserMarker from "./UserMarker";
import RouteLayer from "./RouteLayer";
import TerminalDetailsPage from "../../pages/TerminalDetailsPage";
import ActiveNavigation from "../navigation/ActiveNavigation";

// HOOKS
import { useGeolocation } from "../../hooks/useGeolocation";
import { useAppStore } from "../../stores/useAppStore";

const INITIAL_VIEW = {
  latitude: 14.676,
  longitude: 121.0437,
  zoom: 14,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

export default function MapCanvas() {
  const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const userLocation = useAppStore((state) => state.userLocation);
  const navPhase = useAppStore((state) => state.navPhase);
  const activeNavigation = useAppStore((state) => state.activeNavigation);
  const selectFeature = useAppStore((state) => state.selectFeature);
  const mapRef = useRef<MapRef>(null);

  useGeolocation();

  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW);
  const lastCameraUpdateRef = useRef<number>(0);
  const CAMERA_UPDATE_THROTTLE_MS = 2000; // THROTTLE CAMERA UPDATES TO MAX ONCE PER 2 SECONDS

  // LOCK CAMERA TO USER POSITION IN NAVIGATION MODE (WITH THROTTLING)
  useEffect(() => {
    if (
      navPhase === "navigation" &&
      activeNavigation.isActive &&
      userLocation &&
      mapRef.current
    ) {
      const now = Date.now();
      
      // THROTTLE: ONLY UPDATE CAMERA IF 2 SECONDS HAVE PASSED
      if (now - lastCameraUpdateRef.current < CAMERA_UPDATE_THROTTLE_MS) {
        return;
      }

      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 17,
        bearing: userLocation.heading || 0,
        duration: 1000,
        essential: true,
      });

      lastCameraUpdateRef.current = now;
    }
  }, [
    navPhase,
    activeNavigation.isActive,
    userLocation?.lat,
    userLocation?.lng,
    userLocation?.heading,
  ]);

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        duration: 2000,
        essential: true,
      });
    } else {
      alert("Waiting for GPS signal...");
    }
  };

  if (!mapToken)
    return <div className="p-10 text-red-500">Error: Map Token Missing</div>;

  return (
    <div className="h-screen w-full relative touch-none">
      {/* touch-none added to container to help with mobile gestures */}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onClick={() => selectFeature(null)}
        // PERFORMANCE & GESTURE SETTINGS
        reuseMaps={true}
        preserveDrawingBuffer={true}
        doubleClickZoom={false}
        dragRotate={false}
        touchZoomRotate={true}
        dragPan={true}
        // VISUALS
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapToken}
        maxBounds={[
          [120.9, 14.5],
          [121.2, 14.8],
        ]}
        attributionControl={false}
      >
        {/* LAYERS */}
        <TerminalMarkers />
        <UserMarker />
        <RouteLayer />

        {/* RECENTER BUTTON (ABOVE SHEET) */}
        <div className="absolute bottom-52 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRecenter();
            }}
            className={`
              p-3 rounded-full shadow-lg transition-all
              ${
                userLocation
                  ? "bg-white text-blue-600 hover:bg-blue-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }
            `}
            title="Recenter to my location"
          >
            <Crosshair size={30} />
          </button>
        </div>
      </Map>

      {/* FULL SCREEN PAGE OVERLAY */}
      <TerminalDetailsPage />

      {/* ACTIVE NAVIGATION OVERLAY */}
      {navPhase === "navigation" && <ActiveNavigation />}
    </div>
  );
}
