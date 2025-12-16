// =========================================================================================
// COMPONENT: SEARCH OVERLAY
// UPDATES: REMOVED ALL SEARCH LOGIC. IT NOW OPENS THE FULL-SCREEN ROUTE PAGE.
// =========================================================================================

import { Search } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";

export default function SearchOverlay() {
  const setSearchRoutePageOpen = useAppStore(
    (state) => state.setSearchRoutePageOpen
  );

  return (
    <div className="w-full max-w-lg mx-auto mt-4 px-4">
      <div
        className="
          flex items-center gap-3
          bg-white/95 backdrop-blur-md
          border border-white/50
          rounded-2xl shadow-xl shadow-slate-300/40
          p-3
          cursor-pointer transition-transform duration-200 active:scale-[0.98]
        "
        onClick={() => setSearchRoutePageOpen(true)}
      >
        {/* CENTER: SEARCH INPUT MOCKUP */}
        <div className="flex-1 flex flex-col justify-center h-full px-3">
          <span className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-0.5">
            Where to?
          </span>
          <span className="text-base font-semibold text-slate-600 truncate leading-tight">
            Tap to plan your route
          </span>
        </div>

        {/* RIGHT: SEARCH ACTION BUTTON */}
        <div className="p-3 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/30 active:scale-90 transition-all">
          <Search size={24} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}
