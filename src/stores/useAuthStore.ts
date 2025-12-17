// =========================================================================================
// STORE: AUTHENTICATION STATE MANAGEMENT
// PURPOSE: MANAGES USER AUTHENTICATION STATE USING SUPABASE AUTH
// FEATURES: Login, Register, Logout, Session Persistence
// =========================================================================================

import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  // STATE
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // ACTIONS
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // INITIAL STATE
  user: null,
  session: null,
  isLoading: true,
  error: null,

  // INITIALIZE: CHECK FOR EXISTING SESSION ON APP LOAD
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // GET CURRENT SESSION
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session) {
        set({
          user: session.user,
          session,
          isLoading: false,
        });

        // LISTEN FOR AUTH CHANGES (LOGIN, LOGOUT, TOKEN REFRESH)
        supabase.auth.onAuthStateChange((_event, newSession) => {
          set({
            user: newSession?.user ?? null,
            session: newSession,
          });
        });
      } else {
        set({
          user: null,
          session: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("[AUTH INIT ERROR]:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to initialize auth",
        isLoading: false,
      });
    }
  },

  // SIGN IN: EMAIL/PASSWORD AUTHENTICATION
  signIn: async (email: string, password: string) => {
    try {
      set({ error: null, isLoading: true });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      // SUCCESS: STATE WILL BE UPDATED BY onAuthStateChange LISTENER
      set({ isLoading: false });
      return { error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Sign in failed");
      set({ error: err.message, isLoading: false });
      return { error: err };
    }
  },

  // SIGN UP: REGISTER NEW USER
  signUp: async (email: string, password: string, displayName?: string) => {
    try {
      set({ error: null, isLoading: true });

      // CREATE USER IN SUPABASE AUTH
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      // IF USER CREATED SUCCESSFULLY, CREATE USER PROFILE
      if (authData.user && displayName) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: authData.user.id,
            display_name: displayName,
          });

        if (profileError) {
          console.warn("[PROFILE CREATE WARNING]:", profileError);
          // DON'T FAIL SIGNUP IF PROFILE CREATION FAILS (CAN RETRY LATER)
        }
      }

      set({ isLoading: false });
      return { error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Sign up failed");
      set({ error: err.message, isLoading: false });
      return { error: err };
    }
  },

  // SIGN OUT: LOGOUT USER
  signOut: async () => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signOut();

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      // CLEAR STATE ON SUCCESSFUL LOGOUT
      set({
        user: null,
        session: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("[SIGN OUT ERROR]:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to sign out",
        isLoading: false,
      });
    }
  },

  // CLEAR ERROR: REMOVE ERROR MESSAGE
  clearError: () => {
    set({ error: null });
  },
}));
