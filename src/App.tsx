// =========================================================================================
// APP ENTRY POINT
// UPDATES:
// 1. REMOVED ALL SLIDING ANIMATIONS (INSTANT TAB SWITCHING).
// 2. USED 'visible'/'invisible' TO PRESERVE SCROLL POSITIONS IN BACKGROUND.
// =========================================================================================

import { BrowserRouter, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import MapCanvas from "./components/map/MapCanvas";
import BottomNavBar from "./components/ui/BottomNavBar";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import ActivityPage from "./pages/ActivityPage";
import { useAppStore } from "./stores/useAppStore";

function AppContent() {
  const isTerminalPageOpen = useAppStore((state) => state.isTerminalPageOpen);
  const location = useLocation();

  const isMapActive = location.pathname === "/";
  const isCommunityActive = location.pathname === "/community";
  const isProfileActive = location.pathname === "/profile";
  const isActivityActive = location.pathname === "/activity";

  // HELPER: CLASS FOR OVERLAY PAGES
  // 'visible' = Shows page instantly.
  // 'invisible' = Hides page instantly but KEEPS SCROLL POSITION.
  const getPageClass = (isActive: boolean) => `
    absolute inset-0 z-10 bg-slate-50 
    ${
      isActive ? "visible pointer-events-auto" : "invisible pointer-events-none"
    }
  `;

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-slate-50">
      {/* LAYER 1: THE MAP (Background) */}
      {/* We use opacity to hide it instantly without unmounting WebGL */}
      <div
        className={`absolute inset-0 z-0 ${
          isMapActive
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <MainLayout>
          <MapCanvas />
        </MainLayout>
      </div>

      {/* LAYER 2: OVERLAY PAGES (Foreground) */}

      {/* COMMUNITY PAGE */}
      <div className={getPageClass(isCommunityActive)}>
        <CommunityPage />
      </div>

      {/* ACTIVITY PAGE */}
      <div className={getPageClass(isActivityActive)}>
        <ActivityPage />
      </div>

      {/* PROFILE PAGE */}
      <div className={getPageClass(isProfileActive)}>
        <ProfilePage />
      </div>

      {/* GLOBAL NAVIGATION */}
      {!isTerminalPageOpen && <BottomNavBar />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
