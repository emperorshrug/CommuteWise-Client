// =========================================================================================
// COMPONENT: MAP SHEET - MODERNIZED (FIXED & MAP PICKER INTEGRATED)
// UPDATES:
// 1. Map Picker logic is now consolidated here, replacing the standard content when active.
// 2. Implements the 'Confirm Location' UI.
// 3. Dragging is disabled when in map picker mode.
// 4. FIX: Adjusted initial height to prevent bottom sheet content cut-off.
// 5. UPDATED: Confim/Go Back logic for state preservation and API trigger.
// =========================================================================================

import { motion, type PanInfo, useAnimation } from "framer-motion";
import { useEffect, useCallback, useRef } from "react";
import { useAppStore } from "../../stores/useAppStore";
// IMPORT ICONS FOR ACCIDENTS AND MAP PICKER UI
import {
  Bus,
  AlertTriangle,
  ShieldAlert,
  Map as MapIcon,
  Users,
  Wallet,
  ChevronUp,
  MapPin, // New
  Check, // New
  ArrowLeft, // New
} from "lucide-react";

// --- CONFIGURATION ---
const SHEET_HEIGHTS = {
  MIN: 0.22,
  MAX: 0.98,
};

type SnapPoint = "MIN" | "MAX";

export default function MapSheet() {
  const controls = useAnimation();
  const {
    navPhase,
    isMapPickerActive,
    mapPickerPinLocation,
    mapPickerTargetField,
    setSearchRoutePageOpen,
    setMapPickerPinLocation,
    setMapPickerActive,
    setRouteInput,
    savedRouteForm,
    resetRouteInputs,
  } = useAppStore();
  const heightState = useRef<SnapPoint>("MIN");

  const snapTo = useCallback(
    async (target: SnapPoint) => {
      // Sheet is always minimized in map picker mode.
      const snapTarget = isMapPickerActive ? "MIN" : target;
      heightState.current = snapTarget;
      // Use 78% (MIN=0.22) for Map Picker to ensure full visibility,
      // but keep the original logic for exploration mode if needed.
      let height = SHEET_HEIGHTS[snapTarget];

      // If Map Picker is active, we ensure a slightly higher minimum height
      // by targeting MIN (0.22), which results in a 'top' value of (1-0.22) = 78%
      if (isMapPickerActive) {
        height = SHEET_HEIGHTS.MIN;
      }

      const topValue = `${(1 - height) * 100}%`;

      await controls.start({
        top: topValue,
        transition: { type: "spring", damping: 25, stiffness: 150 },
      });
    },
    [controls, isMapPickerActive]
  );

  useEffect(() => {
    // Force MIN snap in map picker mode, otherwise use navPhase logic
    if (isMapPickerActive) {
      snapTo("MIN");
    } else if (navPhase === "exploration") {
      snapTo("MIN");
    }
  }, [navPhase, snapTo, isMapPickerActive]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Disable drag if map picker is active
    if (isMapPickerActive) return;

    const dragDistance = info.offset.y;
    const velocity = info.velocity.y;
    const current = heightState.current;

    if (dragDistance < -80 || velocity < -400) snapTo("MAX");
    else if (dragDistance > 80 || velocity > 400) snapTo("MIN");
    else snapTo(current);
  };

  // --- MAP PICKER ACTIONS (Updated) ---
  const handleConfirm = () => {
    // 1. Deactivate map picker mode, but KEEP mapPickerPinLocation (triggers geocoding in SearchRoutePage)
    setMapPickerActive(false, null);
    // 2. Return to the SearchRoutePage to run the reverse geocoding API request on mount/state change
    // The SearchRoutePage.tsx useEffect will see: !isMapPickerActive, mapPickerPinLocation (with coords)
    // and execute the reverse geocode, then update the target field.
    setSearchRoutePageOpen(true);
  };

  const handleGoBack = () => {
    // 1. Restore previous form state (State Preservation)
    if (savedRouteForm) {
      setRouteInput("origin", savedRouteForm.origin);
      setRouteInput("destination", savedRouteForm.destination);
    } else {
      // Fallback: If saved state is gone, revert to default.
      resetRouteInputs();
    }

    // 2. Clear map picker states
    setMapPickerPinLocation(null);
    setMapPickerActive(false, null);

    // 3. Return to the SearchRoutePage (State Preservation)
    setSearchRoutePageOpen(true);
  };
  // --- END MAP PICKER ACTIONS ---

  // --- RENDER MAP PICKER UI ---
  if (isMapPickerActive) {
    const lat = mapPickerPinLocation?.lat.toFixed(6) || "N/A";
    const lng = mapPickerPinLocation?.lng.toFixed(6) || "N/A";

    return (
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        animate={controls}
        // FIX: Set initial and animate top for a higher minimized state (78% of screen height)
        initial={{ top: "78%" }}
        className="
          absolute left-0 right-0 bottom-0
          bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
          z-40 overflow-hidden flex flex-col
          pointer-events-auto
        "
        style={{ height: "100vh" }}
      >
        {/* DRAG HANDLE INDICATOR (Cursor is default, drag is disabled) */}
        <div className="w-full flex flex-col items-center pt-3 pb-1 cursor-default">
          <div className="w-14 h-1.5 bg-slate-200 rounded-full mb-1"></div>
          <ChevronUp size={14} className="text-slate-300 opacity-50" />
        </div>

        {/* CONTENT AREA: Map Picker Confirmation */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 scroll-smooth">
          {/* HEADER: Confirm Location */}
          <div className="mb-8 mt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight truncate">
                Confirm Location
              </h2>
              <span
                className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                  mapPickerTargetField === "origin"
                    ? "bg-blue-100 text-blue-500"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {mapPickerTargetField}
              </span>
            </div>

            {/* Location Display */}
            <div className="flex items-center gap-2 mt-2">
              <MapPin size={14} className="text-slate-400" />
              <span className="text-slate-500 text-xs font-semibold truncate">
                Pin at: {lat}, {lng}
              </span>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleGoBack}
                className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft size={20} /> Go Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!mapPickerPinLocation}
                className={`flex-1 py-3.5 flex items-center justify-center gap-2 font-bold rounded-xl shadow-lg transition-colors ${
                  mapPickerPinLocation
                    ? "bg-brand-primary text-white shadow-brand-primary/30 hover:bg-brand-primary/90"
                    : "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed"
                }`}
              >
                <Check size={20} /> Confirm
              </button>
            </div>
          </div>

          {/* MAXIMIZED CONTENT AREA (Empty filler to force scroll) */}
          <div className="space-y-8">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center pt-10">
              Drag map to select location
            </h3>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- EXISTING EXPLORATION VIEW (Use original initial height 85% for MIN) ---
  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.05}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ top: "85%" }}
      className="
        absolute left-0 right-0 bottom-0 
        bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
        z-40 overflow-hidden flex flex-col
        pointer-events-auto 
      "
      style={{ height: "100vh" }}
    >
      {/* DRAG HANDLE INDICATOR */}
      <div className="w-full flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
        <div className="w-14 h-1.5 bg-slate-200 rounded-full mb-1"></div>
        <ChevronUp size={14} className="text-slate-300 opacity-50" />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 scroll-smooth">
        {/* --- HEADER (MINIMIZED VIEW) --- */}
        <div className="mb-8 mt-1">
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight truncate pr-4">
            Brgy. Tandang Sora
          </h2>

          <div className="flex items-center gap-2 mt-2">
            <MapIcon size={14} className="text-slate-400" />
            <span className="text-slate-500 text-xs font-semibold truncate">
              Quezon City, Metro Manila
            </span>
          </div>
        </div>

        {/* ROUTE SELECTION IS HANDLED BY RouteSelectionModal IN MainLayout */}
        {/* REMOVED DUPLICATE ROUTE SELECTION UI FROM MAP SHEET */}

        {/* --- MAXIMIZED CONTENT --- */}
        <div className="space-y-8">
          {/* SECTION 1: INVENTORY CARDS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bus size={64} className="text-yellow-600" />
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mb-2 shadow-sm">
                <Bus size={20} />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">4</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Terminals
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MapIcon size={64} className="text-blue-600" />
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-2 shadow-sm">
                <MapIcon size={20} />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">12</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Mapped Routes
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: REPORTS LIST */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Reports (24h)
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                Updated 5m ago
              </span>
            </div>

            <div className="space-y-3">
              {/* TRAFFIC ITEM */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                    <AlertTriangle size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      Heavy Traffic
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      Visayas Ave. Intersection
                    </div>
                  </div>
                </div>
                <span className="text-xl font-black text-slate-900">5</span>
              </div>

              {/* === ADDED BACK: ACCIDENTS ITEM === */}
              {/* STYLED TO MATCH THE OTHER CARDS */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                    <ShieldAlert size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      Accidents
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      Reported Incidents
                    </div>
                  </div>
                </div>
                {/* ZERO STATE (GRAY COLOR) OR RED IF > 0 */}
                <span className="text-xl font-black text-slate-900">0</span>
              </div>
              {/* ================================== */}

              {/* THEFT ITEM */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center">
                    <Wallet size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      Theft Alert
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      Near Market Area
                    </div>
                  </div>
                </div>
                <span className="text-xl font-black text-slate-900">1</span>
              </div>

              {/* CROWD DENSITY ITEM */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      Crowd Density
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      Real-time App Users
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-slate-900">Low</div>
                  <div className="text-[10px] text-green-600 font-bold uppercase">
                    Smooth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
