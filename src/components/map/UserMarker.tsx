// =========================================================================================
// COMPONENT: USER MARKER - FIXED
// FIXES: REPLACED INLINE STYLE TRANSFORM WITH CSS VARIABLE + TAILWIND CLASS.
// =========================================================================================

import { Marker } from "react-map-gl";
import { useAppStore } from "../../stores/useAppStore";
import type { CSSProperties } from "react"; // Needed for the style type assertion

export default function UserMarker() {
  const userLocation = useAppStore((state) => state.userLocation);

  if (!userLocation) return null;

  const rotation = userLocation.heading || 0;
  const showPointer =
    userLocation.heading !== null && !isNaN(userLocation.heading);

  return (
    <Marker
      latitude={userLocation.lat}
      longitude={userLocation.lng}
      anchor="center"
    >
      {/* FIX: USE CSS VARIABLE FOR DYNAMIC ROTATION 
        We pass the degree value into a variable '--rotation'.
        Tailwind uses it in the class `rotate-[var(--rotation)]`.
      */}
      <div
        className="
          relative flex items-center justify-center w-8 h-8 
          transition-transform duration-300 ease-linear
          rotate-[var(--rotation)]
        "
        style={{ "--rotation": `${rotation}deg` } as CSSProperties}
      >
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping"></div>

        <div className="relative w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center z-10">
          {showPointer && (
            <div className="absolute -top-1">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></div>
            </div>
          )}
        </div>
      </div>
    </Marker>
  );
}
