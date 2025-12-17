// =========================================================================================
// COMPONENT: ACTIVE NAVIGATION
// PURPOSE: DISPLAYS STEP-BY-STEP NAVIGATION INSTRUCTIONS DURING ROUTE NAVIGATION
// FEATURES: Current Step Display, Progress Indicators, Segment Instructions
// =========================================================================================

import {
  Navigation,
  MapPin,
  ArrowRight,
  Clock,
  DollarSign,
} from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useRouteTracking } from "../../hooks/useRouteTracking";

export default function ActiveNavigation() {
  const activeNavigation = useAppStore((state) => state.activeNavigation);
  const setNavPhase = useAppStore((state) => state.setNavPhase);
  const resetNavigation = useAppStore((state) => state.resetNavigation);

  // TRACK USER PROGRESS
  useRouteTracking();

  if (!activeNavigation.isActive || !activeNavigation.route) {
    return null;
  }

  const route = activeNavigation.route;
  const currentSegment = route.segments[activeNavigation.currentSegmentIndex];
  const nextSegment =
    activeNavigation.currentSegmentIndex < route.segments.length - 1
      ? route.segments[activeNavigation.currentSegmentIndex + 1]
      : null;

  const getVehicleIcon = (vehicleType?: string) => {
    switch (vehicleType) {
      case "jeepney":
        return "🚍";
      case "tricycle":
        return "🛺";
      case "e-jeep":
        return "🚐";
      case "bus":
        return "🚌";
      default:
        return "🚶";
    }
  };

  const getSegmentColor = (type: string) => {
    switch (type) {
      case "walk":
        return "text-sky-500 bg-sky-50 border-sky-200";
      case "ride":
        return "text-yellow-500 bg-yellow-50 border-yellow-200";
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const handleEndNavigation = () => {
    resetNavigation();
    setNavPhase("exploration");
  };

  return (
    <div className="absolute bottom-24 left-0 right-0 z-40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-brand-primary/20 p-5 max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-primary/10 rounded-full">
              <Navigation className="text-brand-primary" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Active Navigation</h3>
              <p className="text-xs text-slate-500">
                Segment {activeNavigation.currentSegmentIndex + 1} of{" "}
                {route.segments.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleEndNavigation}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
          >
            End
          </button>
        </div>

        {/* CURRENT STEP */}
        {currentSegment && (
          <div
            className={`mb-4 p-4 rounded-xl border-2 ${getSegmentColor(
              currentSegment.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {currentSegment.type === "walk"
                  ? "🚶"
                  : getVehicleIcon(currentSegment.vehicleType)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">
                  {currentSegment.type === "walk" ? "Walk" : "Ride"}{" "}
                  {currentSegment.type === "ride" && currentSegment.vehicleType
                    ? currentSegment.vehicleType.charAt(0).toUpperCase() +
                      currentSegment.vehicleType.slice(1)
                    : ""}
                </div>
                <div className="text-sm text-slate-600 mb-2">
                  {currentSegment.type === "walk"
                    ? `Walk ${currentSegment.distance_km.toFixed(2)} km to ${
                        currentSegment.end.name
                      }`
                    : `Take ${currentSegment.vehicleType} to ${currentSegment.end.name}`}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {currentSegment.duration_mins} min
                  </div>
                  {currentSegment.fare && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />₱{currentSegment.fare.toFixed(2)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {currentSegment.distance_km.toFixed(2)} km
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEXT STEP PREVIEW */}
        {nextSegment && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <ArrowRight size={14} />
              <span className="font-bold uppercase">Next</span>
            </div>
            <div className="text-sm text-slate-600">
              {nextSegment.type === "walk" ? "Walk" : "Ride"}{" "}
              {nextSegment.type === "ride" && nextSegment.vehicleType
                ? nextSegment.vehicleType
                : ""}{" "}
              to {nextSegment.end.name}
            </div>
          </div>
        )}

        {/* PROGRESS BAR */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>
              {Math.round(
                ((activeNavigation.currentSegmentIndex + 1) /
                  route.segments.length) *
                  100
              )}
              %
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-300"
              style={{
                width: `${
                  ((activeNavigation.currentSegmentIndex + 1) /
                    route.segments.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
