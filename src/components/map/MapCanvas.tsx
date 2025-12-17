// =========================================================================================
// MAP CANVAS - REVERTED & CLEANED (WITH MAP PICKER)
// STATUS: STABLE PRODUCTION VERSION
// UPDATES: Added Map Picker UI (Centered Pin, Tip Box) and Map Move handler.
// =========================================================================================

import { useState, useRef, useEffect } from "react";
import Map, { type MapRef, type ViewStateChangeEvent } from "react-map-gl";
import type { ViewState } from "react-map-gl";
import { Crosshair, MapPin, Move } from "lucide-react"; // Added MapPin and Move for picker UI
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
  const isMapPickerActive = useAppStore((state) => state.isMapPickerActive); // New state
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
  }, [navPhase, activeNavigation.isActive, userLocation]);

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

  // NEW: Handle map move for both standard view and map picker mode
  const handleMapMove = (evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);

    // If Map Picker is active, update the pin location based on the map center
    if (isMapPickerActive && mapRef.current) {
      const center = mapRef.current.getCenter();
      useAppStore.getState().setMapPickerPinLocation({
        lat: center.lat,
        lng: center.lng,
      });
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
        onMove={handleMapMove} // Use consolidated move handler
        onClick={() => {
          // Disable click feature selection when Map Picker is active
          if (!isMapPickerActive) {
            selectFeature(null);
          }
        }}
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

        {/* --- NEW: MAP PICKER UI (Requests #3 & #4) --- */}
        {isMapPickerActive && (
          <>
            {/* 1. Center Pin (Request #4) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-50 pointer-events-none">
              <MapPin
                size={48}
                className="text-red-600 drop-shadow-lg"
                fill="white"
                strokeWidth={1.5}
              />
            </div>

            {/* 2. Shield Tip Box (Request #3) */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg ring-4 ring-white/30">
                <Move size={20} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Drag map to select location
                </span>
              </div>
            </div>
          </>
        )}
        {/* --- END MAP PICKER UI --- */}

        {/* RECENTER BUTTON (ABOVE SHEET) */}
        <div className="absolute bottom-52 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRecenter();
            }}
            // Hide Recenter button when Map Picker is active
            className={`
              p-3 rounded-full shadow-lg transition-all
              ${isMapPickerActive ? "hidden" : ""}
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
