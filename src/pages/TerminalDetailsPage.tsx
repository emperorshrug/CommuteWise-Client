// =========================================================================================
// PAGE: TERMINAL DETAILS
// ANIMATION RESET: REMOVED ALL SCALE EFFECTS.
// =========================================================================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  MapPin,
  Navigation,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Star,
  Calendar,
  Flag,
  ArrowUp,
} from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
import type { Terminal } from "../types/types";

export default function TerminalDetailsPage() {
  const isOpen = useAppStore((state) => state.isTerminalPageOpen);
  const closePage = useAppStore((state) => state.openTerminalPage);
  const selectedFeature = useAppStore((state) => state.selectedFeature);

  const [activeTab, setActiveTab] = useState<"routes" | "reviews">("routes");
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    type: "terminal" | "review" | "route";
    targetName: string;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const terminal = selectedFeature as Terminal;

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setShowScrollTop(scrollContainerRef.current.scrollTop > 300);
      }
    };
    const container = scrollContainerRef.current;
    if (container) container.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClose = () => {
    closePage(false);
    setTimeout(() => {
      setActiveTab("routes");
      setExpandedRouteId(null);
    }, 300);
  };

  if (!isOpen || !terminal) return null;

  const getDotStyle = (type: "start" | "waypoint" | "end") => {
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden"
        >
          <div className="bg-white px-6 pt-6 pb-4 shadow-sm border-b border-slate-100 relative z-10">
            <div className="flex items-center justify-between mb-4">
              {/* BACK BUTTON (NO ANIMATION) */}
              <button
                onClick={handleClose}
                className="p-3 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label="Go Back"
              >
                <ArrowLeft size={28} />
              </button>

              {/* REPORT TERMINAL (NO ANIMATION) */}
              <button
                onClick={() =>
                  setReportModal({
                    isOpen: true,
                    type: "terminal",
                    targetName: terminal.name,
                  })
                }
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                aria-label="Report Terminal Info"
              >
                <Flag size={18} />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Report
                </span>
              </button>
            </div>

            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-extrabold rounded-full uppercase mb-3 inline-block tracking-wider">
              {terminal.vehicle_type} Terminal
            </span>

            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">
              {terminal.name}
            </h1>

            <div className="flex items-start gap-2 text-slate-500 text-base mb-6 font-medium">
              <MapPin size={18} className="mt-1 shrink-0 text-slate-400" />
              <span>{terminal.address}</span>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl mb-1">
              <button
                onClick={() => setActiveTab("routes")}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "routes"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Available Routes
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "reviews"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Reviews ({terminal.rating_count})
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 scroll-smooth bg-slate-50"
          >
            {activeTab === "routes" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pb-20"
              >
                {terminal.routes?.length > 0 ? (
                  terminal.routes.map((route) => {
                    const isExpanded = expandedRouteId === route.id;
                    return (
                      <div
                        key={route.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md relative"
                      >
                        <div
                          className="p-5 cursor-pointer active:bg-slate-50 transition-colors"
                          onClick={() =>
                            setExpandedRouteId(isExpanded ? null : route.id)
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-8">
                              <div className="font-bold text-slate-900 text-xl leading-tight mb-6">
                                {route.name}
                              </div>

                              <div className="flex items-end justify-between mt-2">
                                <div className="flex gap-2">
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                                    {route.distance_km} km
                                  </span>
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                                    ~{route.eta_mins} min
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Regular
                                  </div>
                                  <div className="text-2xl font-black text-brand-primary">
                                    ₱{route.fare_regular}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ROUTE REPORT (NO ANIMATION) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportModal({
                                  isOpen: true,
                                  type: "route",
                                  targetName: route.name,
                                });
                              }}
                              className="absolute top-4 right-4 p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Report Route Issue"
                            >
                              <Flag size={18} />
                            </button>
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
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden mb-6 flex items-center justify-between">
                                  <div>
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">
                                      Discounted Fare
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">
                                      ₱{route.fare_discounted.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="bg-brand-primary text-white text-xs px-2 py-1 rounded-lg font-bold">
                                      -20% (Student/Senior)
                                    </span>
                                  </div>
                                </div>

                                <div className="mb-8 pl-1">
                                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-4 tracking-wide">
                                    Route Stops
                                  </h3>
                                  <div className="relative border-l-2 border-slate-200 ml-2 space-y-8 pb-2">
                                    {route.stops?.map((stop) => (
                                      <div
                                        key={stop.id}
                                        className="relative pl-8"
                                      >
                                        <div
                                          className={`
                                          absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10
                                          ${getDotStyle(stop.type)}
                                        `}
                                        ></div>

                                        <div>
                                          <div
                                            className={`text-base ${
                                              stop.type !== "waypoint"
                                                ? "font-bold text-slate-900"
                                                : "font-medium text-slate-600"
                                            }`}
                                          >
                                            {stop.name}
                                          </div>
                                          {stop.type === "start" && (
                                            <div className="text-[10px] text-green-600 font-bold uppercase mt-0.5">
                                              Start Point
                                            </div>
                                          )}
                                          {stop.type === "end" && (
                                            <div className="text-[10px] text-red-500 font-bold uppercase mt-0.5">
                                              Terminus
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* VIEW MAP BUTTON (NO ANIMATION) */}
                                <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                  <Navigation size={20} />
                                  View Route on Map
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="font-bold">No routes available.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pb-20"
              >
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 text-center">
                  <div className="text-4xl font-black text-slate-900 mb-2">
                    {terminal.rating}
                  </div>
                  <div className="flex justify-center text-yellow-400 gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        fill={
                          i < Math.floor(terminal.rating)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    Based on {terminal.rating_count} verified reviews
                  </div>
                </div>

                {terminal.reviews?.length > 0 ? (
                  terminal.reviews.map((review) => (
                    // REVIEW CARD (NO ZOOM)
                    <div
                      key={review.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-transform"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {review.user_display_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-900">
                              {review.user_display_name}
                            </div>
                            <div className="flex text-yellow-400 text-[10px] mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  fill={
                                    i < review.rating ? "currentColor" : "none"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <Calendar size={12} />
                            {review.date_posted}
                          </div>
                          {/* REVIEW REPORT (NO ANIMATION) */}
                          <button
                            onClick={() =>
                              setReportModal({
                                isOpen: true,
                                type: "review",
                                targetName: `Review by ${review.user_display_name}`,
                              })
                            }
                            className="text-[10px] font-bold text-red-300 hover:text-red-600 flex items-center gap-1 transition-colors uppercase tracking-wide"
                          >
                            <Flag size={12} /> Report
                          </button>
                        </div>
                      </div>

                      <p className="text-base text-slate-700 mb-4 leading-relaxed pl-1">
                        "{review.comment}"
                      </p>

                      <div className="flex items-center gap-6 border-t border-slate-50 pt-3">
                        {/* VOTE BUTTONS (NO ANIMATION) */}
                        <button className="flex items-center gap-2 text-slate-400 hover:text-green-600 text-sm font-bold transition-colors">
                          <ThumbsUp size={16} /> {review.upvotes}
                        </button>
                        <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm font-bold transition-colors">
                          <ThumbsDown size={16} /> {review.downvotes}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    No reviews yet. Be the first!
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={scrollToTop}
                className="absolute bottom-6 right-6 p-4 bg-slate-900 text-white rounded-full shadow-xl hover:bg-slate-800 z-40"
                aria-label="Scroll to top"
              >
                <ArrowUp size={24} />
              </motion.button>
            )}
          </AnimatePresence>

          {reportModal?.isOpen && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Report Issue
                  </h3>
                </div>

                <p className="text-sm text-slate-500 mb-6 font-medium pl-1">
                  Target:{" "}
                  <span className="text-slate-900 font-bold">
                    {reportModal.targetName}
                  </span>
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                      Violation Category
                    </label>
                    <div className="relative">
                      <select
                        aria-label="Select report category"
                        className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
                      >
                        {reportModal.type === "terminal" ||
                        reportModal.type === "route" ? (
                          <>
                            <option>Incorrect Route/Fare Info</option>
                            <option>Terminal/Stop Closed</option>
                            <option>Safety / Security Issue</option>
                            <option>Spam / Duplicate</option>
                          </>
                        ) : (
                          <>
                            <option>Hate Speech / Harassment</option>
                            <option>Misinformation</option>
                            <option>Spam / Bot</option>
                            <option>Inappropriate Content</option>
                          </>
                        )}
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-4 text-slate-400 pointer-events-none"
                        size={20}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                      Description
                    </label>
                    <textarea
                      className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                      rows={3}
                      maxLength={85}
                      placeholder="Please describe the issue clearly..."
                    ></textarea>
                    <div className="text-right text-xs text-slate-400 mt-2 font-bold">
                      0/85
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setReportModal(null)}
                      className="flex-1 py-3.5 text-slate-500 font-bold text-base hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        alert(
                          "Report Submitted! Thank you for helping the community."
                        );
                        setReportModal(null);
                      }}
                      className="flex-1 py-3.5 bg-red-600 text-white font-bold text-base rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
