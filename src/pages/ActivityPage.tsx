// =========================================================================================
// PAGE: ACTIVITY
// ANIMATION RESET: REMOVED ACTIVE SCALING ON LOGIN BUTTON.
// =========================================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Navigation, ScrollText } from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import AuthModal from "../components/auth/AuthModal";

const TRIP_HISTORY = [
  {
    id: 1,
    date: "Dec 16, 2:30 PM",
    origin: "Tandang Sora Terminal",
    destination: "Quezon City Hall",
    distance: "4.2 km",
    eta: "25 min",
    fare: 13.0,
    vehicle: "Jeepney",
    stops: [
      { id: 101, name: "Tandang Sora Terminal", type: "start" },
      { id: 102, name: "Culiat Intersection", type: "waypoint" },
      { id: 103, name: "Quezon City Hall", type: "end" },
    ],
  },
  {
    id: 2,
    date: "Dec 15, 8:00 AM",
    origin: "Philcoa",
    destination: "UP Town Center",
    distance: "3.5 km",
    eta: "18 min",
    fare: 15.0,
    vehicle: "E-Jeep",
    stops: [
      { id: 201, name: "Philcoa", type: "start" },
      { id: 202, name: "CP Garcia", type: "waypoint" },
      { id: 203, name: "UP Town Center", type: "end" },
    ],
  },
];

// =========================================================================================
// PAGE: ACTIVITY PAGE
// UPDATES: CONNECTED TO REAL AUTH STATE
// =========================================================================================

export default function ActivityPage() {
  const user = useAuthStore((state) => state.user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // DERIVE GUEST STATE FROM AUTH
  const isGuest = !user;
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null);

  const getDotStyle = (type: string) => {
    switch (type) {
      case "start":
        return "bg-green-500 ring-4 ring-green-100";
      case "end":
        return "bg-red-500 ring-4 ring-red-100";
      default:
        return "bg-slate-300";
    }
  };

  return (
    <div className="w-full h-full absolute inset-0 bg-slate-50 p-6 pt-12 overflow-y-auto pb-24">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
        Trip History
      </h1>
      <p className="text-slate-500 mb-8">
        Your past journeys and routes taken.
      </p>

      {isGuest ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-6">
            <ScrollText size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Track Your Journeys
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-[240px] leading-relaxed">
            Sign in to save your trip history, track expenses, and earn commuter
            points.
          </p>
          {/* LOGIN BUTTON (NO ANIMATION) */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90 transition-colors"
          >
            Login / Register
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {TRIP_HISTORY.map((trip) => {
            const isExpanded = expandedTripId === trip.id;

            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300"
              >
                <div
                  className="p-5 cursor-pointer active:bg-slate-50"
                  onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {trip.vehicle} Trip
                      </div>
                      <div className="font-bold text-slate-900 text-lg">
                        {trip.destination}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium flex items-center justify-end gap-1">
                        <Clock size={12} /> {trip.date}
                      </div>
                      <div className="text-brand-primary font-black text-lg mt-1">
                        ₱{trip.fare.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                      <Navigation size={12} />
                      <span className="font-bold">{trip.distance}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span>{trip.eta}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wide">
                          Route Timeline
                        </h3>
                        <div className="relative border-l-2 border-slate-200 ml-2 space-y-6 pb-2">
                          {trip.stops.map((stop) => (
                            <div key={stop.id} className="relative pl-6">
                              <div
                                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${getDotStyle(
                                  stop.type
                                )}`}
                              ></div>
                              <div
                                className={`text-sm ${
                                  stop.type !== "waypoint"
                                    ? "font-bold text-slate-900"
                                    : "font-medium text-slate-600"
                                }`}
                              >
                                {stop.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
