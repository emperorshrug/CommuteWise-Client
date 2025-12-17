// =========================================================================================
// MODAL: AUTHENTICATION (LOGIN / REGISTER)
// PURPOSE: PROVIDES LOGIN AND REGISTRATION FORMS USING SUPABASE AUTH
// FEATURES: Email/Password Login, Registration, Error Handling
// =========================================================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps) {
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // RESET FORM WHEN MODAL OPENS/CLOSES OR MODE CHANGES
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Use a microtask to defer state updates
    Promise.resolve().then(() => {
      setEmail("");
      setPassword("");
      setDisplayName("");
      setLocalError(null);
      clearError();
    });
  }, [isOpen, mode, clearError]);

  // CLEAR ERRORS WHEN USER STARTS TYPING
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (localError || error) {
      setLocalError(null);
      clearError();
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (localError || error) {
      setLocalError(null);
      clearError();
    }
  };

  // VALIDATION
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setLocalError("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Please enter a valid email address");
      return false;
    }

    if (!password.trim()) {
      setLocalError("Password is required");
      return false;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return false;
    }

    if (mode === "register" && !displayName.trim()) {
      setLocalError("Display name is required");
      return false;
    }

    return true;
  };

  // HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLocalError(null);
    clearError();

    if (mode === "login") {
      const { error: signInError } = await signIn(email.trim(), password);
      if (!signInError) {
        // SUCCESS: CLOSE MODAL (AUTH STATE WILL BE UPDATED)
        onClose();
      }
    } else {
      const { error: signUpError } = await signUp(
        email.trim(),
        password,
        displayName.trim()
      );
      if (!signUpError) {
        // SUCCESS: CLOSE MODAL OR SWITCH TO LOGIN MODE
        // NOTE: USER MAY NEED TO VERIFY EMAIL DEPENDING ON SUPABASE SETTINGS
        onClose();
        setMode("login");
      }
    }
  };

  if (!isOpen) return null;

  const displayError = localError || error;
  const isFormValid =
    email.trim() && password.trim() && (mode === "login" || displayName.trim());

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-full">
              <User size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            aria-label="Close modal"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* ERROR MESSAGE */}
        <AnimatePresence>
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl border border-red-200 flex items-start gap-2"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{displayError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DISPLAY NAME (REGISTER ONLY) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                Display Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>
            </div>
          )}

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
                disabled={isLoading}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3.5 text-white font-bold text-base rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2
              ${
                isFormValid && !isLoading
                  ? "bg-brand-primary shadow-brand-primary/30 hover:bg-brand-primary/90"
                  : "bg-slate-400 cursor-not-allowed shadow-none"
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {mode === "login" ? "Signing In..." : "Creating Account..."}
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* MODE SWITCH */}
        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setLocalError(null);
                clearError();
              }}
              className="text-brand-primary font-bold hover:underline"
              disabled={isLoading}
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
