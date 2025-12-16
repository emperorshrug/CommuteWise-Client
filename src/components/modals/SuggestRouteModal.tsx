// =========================================================================================
// COMPONENT: SUGGEST ROUTE MODAL
// PURPOSE: ALLOWS USERS TO PROPOSE NEW ROUTES.
// DESIGN: BASED ON PROVIDED IMAGE, WITH ETA/DISTANCE FIELDS REMOVED.
// =========================================================================================

import { X, Plus, GripVertical, MapPin } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

export default function SuggestRouteModal() {
  const isOpen = useAppStore((state) => state.isSuggestRouteModalOpen);
  const close = useAppStore((state) => state.setSuggestRouteModalOpen);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Route Builder</h2>
            <button
              onClick={() => close(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Close Modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* FORM CONTENT */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* ROUTE NAME */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Route Name
              </label>
              <input
                type="text"
                placeholder="e.g. Blue Line"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>

            {/* FARE & TRANSPORT MODE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fare (₱)
                </label>
                <input
                  type="number"
                  placeholder="15"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Disc. (₱)
                </label>
                <input
                  type="number"
                  placeholder="12"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Transport Mode
              </label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-white"
                title="Select Transport Mode"
              >
                <option>Tricycle</option>
                <option>Jeepney</option>
                <option>E-Jeep</option>
                <option>Bus</option>
              </select>
            </div>

            {/* ROUTE STOPS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700">
                  Route Stops
                </label>
                <button className="flex items-center gap-1 text-brand-primary text-sm font-bold hover:underline">
                  <Plus size={16} /> Add Waypoint
                </button>
              </div>

              <div className="space-y-3">
                {/* ORIGIN */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <GripVertical size={20} className="text-slate-400" />
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <input
                    type="text"
                    placeholder="Select Origin..."
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  <MapPin size={20} className="text-slate-400" />
                </div>
                {/* DESTINATION */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <GripVertical size={20} className="text-slate-400" />
                  <MapPin size={20} className="text-red-500" />
                  <input
                    type="text"
                    placeholder="Select Destination..."
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  <MapPin size={20} className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* DESCRIPTION (NEW) */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description / Reason
              </label>
              <textarea
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                rows={3}
                placeholder="Why is this route needed?"
              ></textarea>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center gap-4 p-5 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => close(false)}
              className="flex-1 py-3.5 text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Route Suggested!");
                close(false);
              }}
              className="flex-1 py-3.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90 transition-all"
            >
              Create Route
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
