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
import { useEffect, useCallback, useRef, useState } from "react";
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
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- CONFIGURATION ---
const SHEET_HEIGHTS = {
  MIN: 0.22,
  MAX: 0.98,
  MAP_PICKER: 0.3, // Higher height for map picker to show buttons
};

type SnapPoint = "MIN" | "MAX" | "MAP_PICKER";

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
    mapCenter,
    mapNeedsRefresh,
    setMapNeedsRefresh,
    savedRouteForm,
    resetRouteInputs,
  } = useAppStore();
  const heightState = useRef<SnapPoint>("MIN");

  const snapTo = useCallback(
    async (target: SnapPoint) => {
      // Sheet is always at map picker height in map picker mode.
      const snapTarget = isMapPickerActive ? "MAP_PICKER" : target;
      heightState.current = snapTarget;
      const height = SHEET_HEIGHTS[snapTarget];

      const topValue = `${(1 - height) * 100}%`;

      await controls.start({
        top: topValue,
        transition: { type: "spring", damping: 25, stiffness: 150 },
      });
    },
    [controls, isMapPickerActive]
  );

  useEffect(() => {
    // Force MAP_PICKER snap in map picker mode, otherwise use navPhase logic
    if (isMapPickerActive) {
      snapTo("MAP_PICKER");
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
    // Re-set the pin location object (new reference) to ensure listeners detect the change
    if (mapPickerPinLocation) {
      setMapPickerPinLocation({
        lat: mapPickerPinLocation.lat,
        lng: mapPickerPinLocation.lng,
      });
    }

    // 1. Deactivate map picker mode, but KEEP mapPickerTargetField (listeners will read it)
    setMapPickerActive(false);

    // 2. Return to the SearchRoutePage to run the reverse geocoding API request
    setSearchRoutePageOpen(true);
  };

  // --- BARANGAY / AREA INFO (MINIMIZED SHEET) ---
  const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN;
  const [areaInfo, setAreaInfo] = useState<{ brgy?: string; city?: string; region?: string } | null>(null);
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const [isRefreshDebouncing, setIsRefreshDebouncing] = useState(false);
  const [lastAreaUpdated, setLastAreaUpdated] = useState<number | null>(null);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const fetchedInitiallyRef = useRef(false);
  const cacheRef = useRef<Map<string, { brgy?: string; city?: string; region?: string; ts: number }>>(new Map());
  const cooldownRef = useRef<number | null>(null);

  const fetchBarangayInfo = async (lat?: number, lng?: number, force = false) => {
    if (!LOCATIONIQ_TOKEN) return null;
    const center = lat !== undefined && lng !== undefined ? { lat, lng } : mapCenter;
    if (!center) return null;

    setIsAreaLoading(true);
    try {
      // Simple cache key by rounded coords to reduce repeat API calls
      const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)}`;
      if (!force && cacheRef.current.has(key)) {
        const cached = cacheRef.current.get(key)!;
        setAreaInfo({ brgy: cached.brgy, city: cached.city, region: cached.region });
        setLastAreaUpdated(cached.ts);
        setMapNeedsRefresh(false);
        return { brgy: cached.brgy, city: cached.city, region: cached.region };
      }
      const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_TOKEN}&lat=${center.lat}&lon=${center.lng}&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      const brgy = data.address.suburb || data.address.neighbourhood || data.address.village || data.address.hamlet || data.address.ward || data.address.locality;
      const city = data.address.city || data.address.county || data.address.town || data.address.state_district;
      const region = data.address.state;
      const info = { brgy, city, region };
      setAreaInfo(info);
      const now = Date.now();
      setLastAreaUpdated(now);
      // cache result
      const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)}`;
      cacheRef.current.set(key, { brgy, city, region, ts: now });
      // After fetching area info, clear the refresh flag
      setMapNeedsRefresh(false);
      return info;
    } catch (error) {
      console.error("Barangay lookup failed:", error);
      return null;
    } finally {
      setIsAreaLoading(false);
    }
  };

  // Initial fetch once when component mounts and we have a map center
  useEffect(() => {
    if (fetchedInitiallyRef.current) return;
    if (mapCenter) {
      fetchedInitiallyRef.current = true;
      fetchBarangayInfo(mapCenter.lat, mapCenter.lng);
    }
  }, [mapCenter]);

  // Show refresh button when mapNeedsRefresh is true; clicking triggers fetch with 2s debounce
  const handleRefresh = async () => {
    if (!mapCenter) return;
    // start debounce/loading visual
    setIsRefreshDebouncing(true);
    setTimeout(async () => {
      try {
        await fetchBarangayInfo(mapCenter.lat, mapCenter.lng, true);
      } finally {
        setIsRefreshDebouncing(false);
      }
    }, 2000);
  };

  // When maximized, fetch related terminals/reports using barangay or bbox
  const fetchLocalDetails = async () => {
    if (!areaInfo) return;
    try {
      // Terminals: try to match by address containing barangay name
      const brgy = areaInfo.brgy;
      if (brgy) {
        const { data: tdata, error: terr } = await supabase
          .from("terminals")
          .select("*")
          .ilike("address", `%${brgy}%`)
          .limit(20);
        if (terr) {
          console.warn("Terminal lookup error:", terr);
          setTerminals([]);
        } else {
          setTerminals(tdata || []);
        }
      }

      // Reports: query within small bbox around center
      if (mapCenter) {
        const delta = 0.02; // ~2km box
        const { data: rdata, error: rerr } = await supabase
          .from("reports")
          .select("*")
          .gte("lat", mapCenter.lat - delta)
          .lte("lat", mapCenter.lat + delta)
          .gte("lng", mapCenter.lng - delta)
          .lte("lng", mapCenter.lng + delta);
        if (rerr) {
          console.warn("Reports lookup error:", rerr);
          setReports([]);
        } else {
          setReports(rdata || []);
        }
      }
    } catch (error) {
      console.error("Local details fetch error:", error);
    }
  };

  useEffect(() => {
    if (navPhase === "selection" && areaInfo) {
      fetchLocalDetails();
    }
  }, [navPhase, areaInfo, mapCenter]);

  // Helpers
  const formatTimeAgo = (ts: number | null) => {
    if (!ts) return "Updated unknown";
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Updated just now";
    if (mins < 60) return `Updated ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Updated ${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `Updated ${days}d ago`;
  };

  const computeCrowdDensity = () => {
    // Simple heuristic: reports nearby indicate activity
    const r = reports.length;
    if (r > 10) return { label: "High", badge: "text-red-600", status: "Congested" };
    if (r > 2) return { label: "Medium", badge: "text-amber-600", status: "Busy" };
    return { label: "Low", badge: "text-green-600", status: "Smooth" };
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
        <div className="mb-8 mt-1 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight truncate pr-4">
              {areaInfo?.brgy ? `Brgy. ${areaInfo.brgy}` : "Brgy. Unknown"}
            </h2>

            <div className="flex items-center gap-2 mt-2">
              <MapIcon size={14} className="text-slate-400" />
              <span className="text-slate-500 text-xs font-semibold truncate">
                {areaInfo?.city ? `${areaInfo.city}, ${areaInfo?.region ?? ""}` : "Location Unknown"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mapNeedsRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshDebouncing || isAreaLoading}
                className="p-2 rounded-full bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors"
                aria-label="Refresh area info"
                title="Refresh area info"
              >
                <RefreshCw
                  size={18}
                  className={`text-slate-600 ${
                    isRefreshDebouncing || isAreaLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}
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
                    <div className="text-3xl font-black text-slate-900">{terminals.length}</div>
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
                <div className="text-3xl font-black text-slate-900">{terminals.reduce((acc, t) => acc + (t.routes?.length || 0), 0)}</div>
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
                {formatTimeAgo(lastAreaUpdated)}
              </span>
            </div>

            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No recent reports in this area.</div>
              ) : (
                reports.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.type === 'accident' ? 'bg-red-50 text-red-600' : r.type === 'traffic' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {r.type === 'accident' ? <ShieldAlert size={18} /> : r.type === 'traffic' ? <AlertTriangle size={18} /> : <MapIcon size={18} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{r.type?.toUpperCase() || 'INFO'}</div>
                        <div className="text-xs text-slate-400 font-medium truncate">{r.description || 'No description'}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">{new Date(r.created_at).toLocaleTimeString()}</div>
                  </div>
                ))
              )}

              {/* Crowd Density */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">Crowd Density</div>
                    <div className="text-xs text-slate-400 font-medium">Real-time App Signals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-slate-900">{computeCrowdDensity().label}</div>
                  <div className={`text-[10px] ${computeCrowdDensity().badge} font-bold uppercase`}>{computeCrowdDensity().status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
