// =========================================================================================
// MAIN LAYOUT - OPTIMIZED
// UPDATES: REMOVED MapPickerConfirmationSheet. MapSheet now handles both states.
// =========================================================================================

import type { ReactNode } from "react";
import SearchOverlay from "../components/ui/SearchOverlay";
import MapSheet from "../components/ui/MapSheet";
import { useAppStore } from "../stores/useAppStore";
import FloatingReportButton from "../components/ui/FloatingReportButton";
import SuggestRouteModal from "../components/modals/SuggestRouteModal";
import RouteSelectionModal from "../components/modals/RouteSelectionModal";
import SearchRoutePage from "../pages/SearchRoutePage";
import { AnimatePresence } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
}

// --- REMOVED: MapPickerConfirmationSheet (Logic moved to MapSheet.tsx) ---

export default function MainLayout({ children }: MainLayoutProps) {
  const isTerminalPageOpen = useAppStore((state) => state.isTerminalPageOpen);
  const isSearchRoutePageOpen = useAppStore(
    (state) => state.isSearchRoutePageOpen
  );
  const isMapPickerActive = useAppStore((state) => state.isMapPickerActive);
  const navPhase = useAppStore((state) => state.navPhase);
  const calculatedRoutes = useAppStore((state) => state.calculatedRoutes);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);

  // Determine if the Search Overlay should be visible (Hidden when Map Picker is active)
  const showSearchOverlay =
    !isTerminalPageOpen && !isSearchRoutePageOpen && !isMapPickerActive;

  // Determine if the Map Sheet should be visible (Always visible on map page, even during map picking)
  const showMapSheet = !isTerminalPageOpen && !isSearchRoutePageOpen;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-brand-surface">
      {/* LAYER 0: MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">{children}</div>

      {/* LAYER 10: UI OVERLAYS (Search & Sheet) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Search Overlay (Request #1: Hidden when map picker is active) */}
        <div
          className={`
            absolute top-4 left-4 right-4 z-20 pointer-events-auto transition-opacity duration-300
            ${
              showSearchOverlay
                ? "opacity-100 visible"
                : "opacity-0 invisible pointer-events-none"
            }
          `}
        >
          <SearchOverlay />
        </div>

        {/* Map Sheet (Request #1 & #2: Now contains all bottom sheet logic) */}
        <div
          className={`
            absolute inset-0 z-30 pointer-events-none transition-opacity duration-300
            ${
              showMapSheet
                ? "opacity-100 visible"
                : "opacity-0 invisible pointer-events-none"
            }
          `}
        >
          <MapSheet />
        </div>
      </div>

      {/* GLOBAL FLOATING BUTTON (Request #1: Hidden when map picker is active) */}
      {showSearchOverlay && <FloatingReportButton />}

      {/* GLOBAL MODALS */}
      <SuggestRouteModal />

      {/* ROUTE SELECTION MODAL */}
      <AnimatePresence>
        {navPhase === "selection" && calculatedRoutes.length > 0 && (
          <RouteSelectionModal
            routes={calculatedRoutes}
            onSelect={(route) => {
              setSelectedRoute(route);
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
    </div>
  );
}
