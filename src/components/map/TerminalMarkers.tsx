// =========================================================================================
// COMPONENT: TERMINAL MARKERS - OPTIMIZED
// PERFORMANCE: USES 'React.memo' TO PREVENT RE-RENDERS ON MAP DRAG.
// =========================================================================================

import React, { useMemo } from "react"; // IMPORT MEMO
import { Marker, Popup } from "react-map-gl";
import { Bus, Bike, Zap, MapPin, Star } from "lucide-react";
import { TERMINALS_DATA } from "../../lib/graph";
import { useAppStore } from "../../stores/useAppStore";
import type { VehicleType } from "../../types/types";

const getMarkerStyle = (type: VehicleType) => {
  switch (type) {
    case "jeepney":
      return { color: "bg-yellow-500", Icon: Bus };
    case "tricycle":
      return { color: "bg-green-500", Icon: Bike };
    case "e-jeep":
      return { color: "bg-purple-500", Icon: Zap };
    default:
      return { color: "bg-blue-500", Icon: MapPin };
  }
};

function TerminalMarkers() {
  const selectedFeature = useAppStore((state) => state.selectedFeature);
  const selectFeature = useAppStore((state) => state.selectFeature);
  const openTerminalPage = useAppStore((state) => state.openTerminalPage);

  // MEMOIZE THE MARKER LIST
  // React will simply cache this list and only update if 'selectedFeature' changes.
  // It won't re-calculate during map pans/zooms.
  const markers = useMemo(() => {
    return TERMINALS_DATA.map((terminal) => {
      const { color, Icon } = getMarkerStyle(terminal.vehicle_type);
      const isSelected = selectedFeature?.id === terminal.id;

      return (
        <div key={terminal.id}>
          <Marker
            latitude={terminal.lat}
            longitude={terminal.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation(); // Stops CLICK bubbling
              if (isSelected) {
                selectFeature(null);
              } else {
                selectFeature(terminal);
              }
            }}
          >
            <div
              // --- FIX: STOP TOUCH GESTURES FROM REACHING THE MAP ---
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              // -----------------------------------------------------

              className={`
                p-2 rounded-full shadow-lg border-2 border-white 
                cursor-pointer transform transition-transform 
                ${
                  isSelected
                    ? "scale-125 ring-2 ring-offset-2 ring-brand-primary"
                    : "hover:scale-110"
                }
                ${color}
              `}
            >
              <Icon size={20} className="text-white" />
            </div>
          </Marker>

          {isSelected && (
            <Popup
              latitude={terminal.lat}
              longitude={terminal.lng}
              anchor="bottom"
              offset={25}
              closeButton={false}
              closeOnClick={false}
              onClose={() => selectFeature(null)}
              className="z-50"
            >
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">
                  {terminal.name}
                </h3>
                <p className="text-xs text-slate-500 mb-2 truncate max-w-[180px]">
                  {terminal.address}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={10}
                        fill={
                          i < Math.floor(terminal.rating)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {terminal.rating}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({terminal.rating_count})
                  </span>
                </div>
                <button
                  onClick={() => openTerminalPage(true)}
                  className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded shadow-sm hover:bg-brand-primary/90 transition-colors outline-none focus:outline-none focus:ring-0"
                >
                  View Terminal
                </button>
              </div>
            </Popup>
          )}
        </div>
      );
    });
  }, [selectedFeature, selectFeature, openTerminalPage]); // Dependencies

  return <>{markers}</>;
}

// WRAP THE EXPORT IN REACT.MEMO
export default React.memo(TerminalMarkers);
