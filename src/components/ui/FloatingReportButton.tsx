// =========================================================================================
// COMPONENT: FLOATING REPORT BUTTON (CONTEXT AWARE)
// UPDATES:
// 1. ADDED 'CREATE NEW POST' OPTION WHEN ON COMMUNITY PAGE.
// 2. ENSURED MAP OPTIONS ONLY SHOW ON MAP PAGE.
// =========================================================================================

// =========================================================================================
// COMPONENT: FLOATING REPORT BUTTON (CONTEXT AWARE)
// UPDATES: AUTHENTICATION REQUIRED FOR REPORTING ACTIONS
// =========================================================================================

import { useState, type ElementType } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPinPlus,
  Signpost,
  MessageSquareWarning,
  X,
  PenSquare,
} from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useAuthStore } from "../../stores/useAuthStore";
import AuthModal from "../auth/AuthModal";

interface OptionButtonProps {
  icon: ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

const OptionButton = ({
  icon: Icon,
  label,
  onClick,
  color = "text-slate-700",
}: OptionButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 transition-colors text-left ${color}`}
  >
    <div className="shrink-0">
      <Icon size={20} />
    </div>
    <span className="font-bold text-sm whitespace-nowrap">{label}</span>
  </button>
);

export default function FloatingReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setSuggestRouteModalOpen = useAppStore(
    (state) => state.setSuggestRouteModalOpen
  );

  // CONTEXT LOGIC
  const isMapPage = location.pathname === "/";
  const isCommunityPage = location.pathname === "/community";

  // AUTH CHECK HELPER
  const requireAuth = (callback: () => void) => {
    if (!user) {
      setIsAuthModalOpen(true);
      setIsOpen(false);
    } else {
      callback();
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="absolute bottom-24 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 mb-4 w-72 origin-bottom-right"
          >
            <div className="space-y-1">
              {/* GLOBAL OPTION */}
              <OptionButton
                icon={MessageSquareWarning}
                label="Report App Issue"
                onClick={() => alert("Report App Issue Clicked")}
              />

              {/* COMMUNITY SPECIFIC OPTIONS */}
              {isCommunityPage && (
                <>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <OptionButton
                    icon={PenSquare}
                    label="Create New Post"
                    onClick={() => alert("Open New Post Modal")}
                    color="text-brand-primary"
                  />
                </>
              )}

              {/* MAP SPECIFIC OPTIONS */}
              {isMapPage && (
                <>
                  <OptionButton
                    icon={AlertTriangle}
                    label="Report Map Error"
                    onClick={() => requireAuth(() => alert("Report Map Error Clicked"))}
                    color="text-red-600"
                  />
                  <div className="h-px bg-slate-100 my-2"></div>
                  <OptionButton
                    icon={MapPinPlus}
                    label="Add Community Marker"
                    onClick={() => requireAuth(() => alert("Add Marker Clicked"))}
                    color="text-brand-primary"
                  />
                  <OptionButton
                    icon={Signpost}
                    label="Suggest New Route"
                    onClick={() => {
                      toggleMenu();
                      setSuggestRouteModalOpen(true);
                    }}
                    color="text-brand-primary"
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleMenu}
        className={`
          p-4 rounded-full shadow-lg border-2 transition-all duration-300
          ${
            isOpen
              ? "bg-slate-100 text-slate-600 border-slate-300 rotate-90"
              : "bg-white text-brand-primary border-brand-primary"
          }
        `}
        aria-label="Accessibility Menu"
      >
        {isOpen ? <X size={24} /> : <AlertTriangle size={24} />}
      </button>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
