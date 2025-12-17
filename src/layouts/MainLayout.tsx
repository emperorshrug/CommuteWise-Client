// =========================================================================================
// MAIN LAYOUT
// UPDATES: ADDED GLOBAL SEARCH ROUTE PAGE AND MAP PICKER CONFIRMATION SHEET.
// =========================================================================================

import type { ReactNode } from "react";
import SearchOverlay from "../components/ui/SearchOverlay";
import MapSheet from "../components/ui/MapSheet";
import { useAppStore } from "../stores/useAppStore";
import FloatingReportButton from "../components/ui/FloatingReportButton";
import SuggestRouteModal from "../components/modals/SuggestRouteModal";
import RouteSelectionModal from "../components/modals/RouteSelectionModal";
import SearchRoutePage from "../pages/SearchRoutePage";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

// --- NEW COMPONENT: MapPickerConfirmationSheet (Feature 1) ---
const MapPickerConfirmationSheet = () => {
  const {
    mapPickerPinLocation,
    mapPickerTargetField,
    setSearchRoutePageOpen,
    setMapPickerPinLocation,
    setMapPickerActive,
    setRouteInput,
    savedRouteForm,
    resetRouteInputs,
  } = useAppStore();

  // Feature 1: Confirms the pin, triggers the reverse geocoding via SearchRoutePage's useEffect
  const handleConfirm = () => {
    // 1. Deactivate map picker mode, but KEEP mapPickerPinLocation
    setMapPickerActive(false, null);
    // 2. Set SearchRoutePage to false temporarily. The useEffect in SearchRoutePage.tsx
    //    will detect this state, perform reverse geocode, and re-open the search page with the result.
    setSearchRoutePageOpen(false);
  };

  // Feature 1: Go back returns to the previous state without API activation
  const handleGoBack = () => {
    // 1. Restore previous form state (from savedRouteForm)
    if (savedRouteForm) {
      setRouteInput("origin", savedRouteForm.origin);
      setRouteInput("destination", savedRouteForm.destination);
    } else {
      // If for some reason saved state is gone, revert to default.
      resetRouteInputs();
    }

    // 2. Clear map picker states
    setMapPickerPinLocation(null);
    setMapPickerActive(false, null);

    // 3. Return to the SearchRoutePage
    setSearchRoutePageOpen(true);
  };

  if (!mapPickerPinLocation) return null;

  const lat = mapPickerPinLocation.lat.toFixed(6);
  const lng = mapPickerPinLocation.lng.toFixed(6);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">
          Confirm Pin Location
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
      <p className="text-slate-500 text-sm mb-4">
        Pin at:{" "}
        <span className="font-mono text-slate-700">
          {lat}, {lng}
        </span>
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleGoBack}
          className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={20} /> Go Back
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90 transition-colors"
        >
          <Check size={20} /> Confirm Location
        </button>
      </div>
    </motion.div>
  );
};
// --- END NEW COMPONENT ---

export default function MainLayout({ children }: MainLayoutProps) {
  const isTerminalPageOpen = useAppStore((state) => state.isTerminalPageOpen);
  const isSearchRoutePageOpen = useAppStore(
    (state) => state.isSearchRoutePageOpen
  );
  const isMapPickerActive = useAppStore((state) => state.isMapPickerActive);
  const navPhase = useAppStore((state) => state.navPhase);
  const calculatedRoutes = useAppStore((state) => state.calculatedRoutes);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const setNavPhase = useAppStore((state) => state.setNavPhase);

  // Determine if the Search Overlay should be visible
  const showSearchOverlay =
    !isTerminalPageOpen && !isSearchRoutePageOpen && !isMapPickerActive;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-brand-surface">
      {/* LAYER 0: MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">{children}</div>

      {/* LAYER 10: UI OVERLAYS (Search & Sheet) */}
      <div
        className={`
          absolute inset-0 z-10 pointer-events-none transition-opacity duration-300
          ${showSearchOverlay ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      >
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-auto">
          <SearchOverlay />
        </div>
        <div className="absolute inset-0 z-30 pointer-events-none">
          <MapSheet />
        </div>
      </div>

      {/* GLOBAL FLOATING BUTTON */}
      {!isTerminalPageOpen && !isSearchRoutePageOpen && !isMapPickerActive && (
        <FloatingReportButton />
      )}

      {/* GLOBAL MODALS */}
      <SuggestRouteModal />

      {/* ROUTE SELECTION MODAL */}
      <AnimatePresence>
        {navPhase === "selection" && calculatedRoutes.length > 0 && (
          <RouteSelectionModal
            routes={calculatedRoutes}
            onSelect={(route) => {
              setSelectedRoute(route);
              // NAVIGATION IS STARTED BY RouteSelectionModal's handleSelectRoute
            }}
            onClose={() => {
              // MODAL CLOSES AUTOMATICALLY WHEN ROUTE IS SELECTED
            }}
          />
        )}
      </AnimatePresence>

      {/* FULL-SCREEN ROUTE SEARCH PAGE (Sits above everything else) */}
      <AnimatePresence>
        {isSearchRoutePageOpen && <SearchRoutePage />}
      </AnimatePresence>

      {/* MAP PICKER CONFIRMATION SHEET (Sits above the map, but below SearchRoutePage) (Feature 1) */}
      <AnimatePresence>
        {isMapPickerActive && !isSearchRoutePageOpen && (
          <MapPickerConfirmationSheet />
        )}
      </AnimatePresence>
    </div>
  );
}
