import { Marker } from "react-map-gl";
import { STOPS_DATA } from "../../lib/graph";
import type { VehicleType } from "../../types/types";
import { useAppStore } from "../../stores/useAppStore"; // IMPORT STORE

// ... (Keep getStopColor helper function as is) ...
const getStopColor = (types: VehicleType[]) => {
  if (types.length > 1) return "bg-orange-500 border-orange-800";
  const type = types[0];
  switch (type) {
    case "jeepney":
      return "bg-yellow-400 border-yellow-700";
    case "tricycle":
      return "bg-green-400 border-green-700";
    case "e-jeep":
      return "bg-purple-400 border-purple-700";
    case "bus":
      return "bg-blue-600 border-blue-900";
    default:
      return "bg-gray-400";
  }
};

export default function StopMarkers() {
  // CONNECT STORE
  const selectFeature = useAppStore((state) => state.selectFeature);

  return (
    <>
      {STOPS_DATA.map((stop) => (
        <Marker
          key={`stop-${stop.id}`}
          latitude={stop.lat}
          longitude={stop.lng}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            selectFeature(stop); // TRIGGER SELECTION
          }}
        >
          <div
            className={`
              w-3 h-3 rounded-full border-2 shadow-sm
              ${getStopColor(stop.vehicle_types)} 
              hover:w-4 hover:h-4 transition-all cursor-pointer
            `}
            title={`${stop.name} (${stop.vehicle_types.join(", ")})`}
          />
        </Marker>
      ))}
    </>
  );
}
