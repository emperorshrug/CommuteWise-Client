// =========================================================================================
// MODAL: ROUTE SELECTION
// PURPOSE: DISPLAYS 3 ROUTE OPTIONS (FASTEST, CHEAPEST, SHORTEST) FOR USER SELECTION
// =========================================================================================

import { motion, AnimatePresence } from "framer-motion";
import { Clock, DollarSign, Route as RouteIcon, Zap, Wallet, MapPin } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import type { CalculatedRoute } from "../../types/route";

interface RouteSelectionModalProps {
  routes: CalculatedRoute[];
  onSelect: (route: CalculatedRoute) => void;
  onClose?: () => void;
}

export default function RouteSelectionModal({
  routes,
  onSelect,
  onClose,
}: RouteSelectionModalProps) {
  const setActiveNavigation = useAppStore((state) => state.setActiveNavigation);
  const setNavPhase = useAppStore((state) => state.setNavPhase);

  const handleSelectRoute = (route: CalculatedRoute) => {
    // START NAVIGATION WHEN ROUTE IS SELECTED
    setActiveNavigation({
      route,
      currentSegmentIndex: 0,
      currentStepIndex: 0,
      traveledPath: null,
      remainingPath: route,
      isActive: true,
    });
    setNavPhase("navigation");
    onSelect(route);
    if (onClose) onClose();
  };
  const getTagColor = (tag: CalculatedRoute["tag"]) => {
    switch (tag) {
      case "FASTEST":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "CHEAPEST":
        return "bg-green-100 text-green-700 border-green-300";
      case "SHORTEST":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getTagIcon = (tag: CalculatedRoute["tag"]) => {
    switch (tag) {
      case "FASTEST":
        return Zap;
      case "CHEAPEST":
        return Wallet;
      case "SHORTEST":
        return RouteIcon;
      default:
        return RouteIcon;
    }
  };

  const getVehicleColor = (vehicleType: string) => {
    switch (vehicleType) {
      case "jeepney":
        return "bg-yellow-500";
      case "tricycle":
        return "bg-green-500";
      case "e-jeep":
        return "bg-purple-500";
      case "bus":
        return "bg-blue-700";
      default:
        return "bg-slate-500";
    }
  };

  if (routes.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="bg-white w-full max-w-2xl rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Select Route</h3>
            <p className="text-sm text-slate-500 mt-1">
              Choose your preferred route option
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              aria-label="Close modal"
            >
              <span className="text-2xl">×</span>
            </button>
          )}
        </div>

        {/* ROUTE CARDS */}
        <div className="space-y-4">
          {routes.map((route) => {
            const TagIcon = getTagIcon(route.tag);
            const primaryVehicle = route.vehicleTypes[0] || "jeepney";

            return (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route)}
                className="w-full text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-brand-primary transition-all hover:shadow-lg bg-white"
              >
                {/* TAG BADGE */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getTagColor(
                      route.tag
                    )}`}
                  >
                    <TagIcon size={14} />
                    {route.tag}
                  </div>
                  <div className="flex items-center gap-2">
                    {route.vehicleTypes.map((vt) => (
                      <div
                        key={vt}
                        className={`w-6 h-6 rounded-full ${getVehicleColor(vt)}`}
                        title={vt}
                      />
                    ))}
                  </div>
                </div>

                {/* ROUTE SUMMARY */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Duration</div>
                      <div className="font-bold text-slate-900">
                        {route.totalDuration_mins} min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Fare</div>
                      <div className="font-bold text-slate-900">
                        ₱{route.totalFare.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RouteIcon size={18} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Distance</div>
                      <div className="font-bold text-slate-900">
                        {route.totalDistance_km.toFixed(2)} km
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROUTE STOPS PREVIEW */}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin size={14} />
                  <span className="truncate">
                    {route.segments[0]?.start.name} →{" "}
                    {route.segments[route.segments.length - 1]?.end.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

