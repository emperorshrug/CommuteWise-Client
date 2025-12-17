import { createClient } from "@supabase/supabase-js";

// 1. Load variables from .env
// We use 'import.meta.env' to access Vite environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Safety Check (Senior Dev Practice)
// This ensures the app warns if you forgot the .env file
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "WARNING: Missing Supabase Environment Variables. Some features may not work. Check your .env file."
  );
}

// 3. Export the Client (with fallback values for development)
// We will import this 'supabase' object whenever we need to fetch data.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
