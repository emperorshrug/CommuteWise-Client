// =========================================================================================
// AUTH HELPER FUNCTIONS
// PURPOSE: UTILITY FUNCTIONS FOR AUTHENTICATION OPERATIONS
// =========================================================================================

import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

/**
 * GET USER PROFILE: FETCHES USER PROFILE DATA FROM SUPABASE
 */
export const getUserProfile = async (
  userId: string
): Promise<{ display_name: string | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    if (error) {
      return { display_name: null, error };
    }

    return { display_name: data?.display_name ?? null, error: null };
  } catch (error) {
    return {
      display_name: null,
      error: error instanceof Error ? error : new Error("Failed to fetch profile"),
    };
  }
};

/**
 * UPDATE USER PROFILE: UPDATES USER PROFILE DISPLAY NAME
 */
export const updateUserProfile = async (
  userId: string,
  displayName: string
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error("Failed to update profile"),
    };
  }
};

/**
 * CHECK IF USER IS AUTHENTICATED: HELPER FOR AUTH GUARDS
 */
export const isAuthenticated = (user: User | null): boolean => {
  return user !== null;
};

