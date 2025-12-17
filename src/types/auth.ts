// =========================================================================================
// AUTH TYPES
// PURPOSE: TYPESCRIPT INTERFACES FOR AUTHENTICATION
// =========================================================================================

import type { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  profile?: UserProfile;
}

export interface AuthSession extends Session {
  user: AuthUser;
}

