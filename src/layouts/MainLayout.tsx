// =========================================================================================
// MAIN LAYOUT
// UPDATES: ADDED GLOBAL SEARCH ROUTE PAGE.
// =========================================================================================

import type { ReactNode } from "react";
import SearchOverlay from "../components/ui/SearchOverlay";
import MapSheet from "../components/ui/MapSheet";
import { useAppStore } from "../stores/useAppStore";
import FloatingReportButton from "../components/ui/FloatingReportButton";
import SuggestRouteModal from "../components/modals/SuggestRouteModal";
import SearchRoutePage from "../pages/SearchRoutePage"; // NEW IMPORT
import { AnimatePresence } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const isTerminalPageOpen = useAppStore((state) => state.isTerminalPageOpen);
  const isSearchRoutePageOpen = useAppStore(
    (state) => state.isSearchRoutePageOpen
  ); // NEW STATE

  // Determine if the Search Overlay should be visible
  const showSearchOverlay = !isTerminalPageOpen && !isSearchRoutePageOpen;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-brand-surface">
      {/* LAYER 0: MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">{children}</div>

      {/* LAYER 10: UI OVERLAYS (Search & Sheet) */}
      {/* Search Overlay is only visible if the dedicated search page is closed */}
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
      {!isTerminalPageOpen && !isSearchRoutePageOpen && (
        <FloatingReportButton />
      )}

      {/* GLOBAL MODALS */}
      <SuggestRouteModal />

      {/* FULL-SCREEN ROUTE SEARCH PAGE (Sits above everything else) */}
      <AnimatePresence>
        {isSearchRoutePageOpen && <SearchRoutePage />}
      </AnimatePresence>
    </div>
  );
}
