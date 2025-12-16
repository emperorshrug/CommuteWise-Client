import { createClient } from "@supabase/supabase-js";

// 1. Load variables from .env
// We use 'import.meta.env' to access Vite environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Safety Check (Senior Dev Practice)
// This ensures the app crashes with a helpful error if you forgot the .env file,
// rather than failing silently with weird bugs later.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "CRITICAL ERROR: Missing Supabase Environment Variables. Check your .env file."
  );
}

// 3. Export the Client
// We will import this 'supabase' object whenever we need to fetch data.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
