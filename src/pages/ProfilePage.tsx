// =========================================================================================
// PAGE: PROFILE
// ANIMATION RESET: REMOVED ACTIVE SCALES ON BUTTONS AND CARDS.
// =========================================================================================

import type { useState } from "react";
import {
  Mail,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const USER_FEEDBACKS = [
  {
    id: 1,
    title: "Wrong Fare Info at Tandang Sora",
    status: "resolved",
    date: "2 days ago",
  },
  { id: 2, title: "Reported Map Issue", status: "pending", date: "5 days ago" },
];

// =========================================================================================
// PAGE: PROFILE PAGE
// UPDATES: CONNECTED TO REAL AUTH STATE
// =========================================================================================

import { useState } from "react";
import { useAuthStore } from "../stores/useAuthStore";
import AuthModal from "../components/auth/AuthModal";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // DERIVE GUEST STATE FROM AUTH
  const isGuest = !user;
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<number | null>(
    null
  );

  return (
    <div className="w-full h-full absolute inset-0 bg-slate-50 p-6 pt-12 overflow-y-auto pb-24">
      {/* HEADER PROFILE CARD */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {isGuest ? "G" : "JD"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-slate-900 truncate">
            {isGuest ? "Guest User" : "John Doe"}
          </h1>
          <p className="text-slate-500 font-medium text-sm truncate">
            {isGuest ? "@commuter_guest" : "@johndoe_99"}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
            <Mail size={12} />
            <span className="truncate">
              {isGuest ? "Not registered" : "john.doe@email.com"}
            </span>
          </div>
        </div>
      </div>

      {isGuest ? (
        // GUEST VIEW (NO ANIMATION ON BUTTON)
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-6">
            <Shield size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Access Full Features
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-[240px] leading-relaxed">
            Sign in to save routes, earn points, and manage your account
            security.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90 transition-colors"
          >
            Login / Register
          </button>
        </div>
      ) : (
        // REGISTERED VIEW (NO SCALES ON CARDS)
        <>
          <div className="space-y-3 mb-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Account Security
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-colors cursor-pointer hover:bg-slate-50">
                <Mail size={24} className="text-brand-primary mb-2" />
                <div className="font-bold text-slate-900 text-sm">
                  Change Email
                </div>
              </div>

              <div className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-colors cursor-pointer hover:bg-slate-50">
                <Lock size={24} className="text-brand-primary mb-2" />
                <div className="font-bold text-slate-900 text-sm">
                  Change Password
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-3">
              Your Reports & Feedback
            </h2>

            <div className="space-y-3">
              {USER_FEEDBACKS.map((item) => {
                const isExpanded = expandedFeedbackId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all"
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedFeedbackId(isExpanded ? null : item.id)
                      }
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.status === "resolved" ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                              <CheckCircle2 size={10} /> Resolved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                              <AlertCircle size={10} /> Pending
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {item.date}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {item.title}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="bg-slate-50 border-t border-slate-100 px-4 py-3"
                        >
                          <p className="text-xs text-slate-600">
                            Admin Note: We have verified this report and updated
                            the fare matrix. Thank you for your contribution!
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
