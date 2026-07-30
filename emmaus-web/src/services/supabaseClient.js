import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client — Singleton instance used across the application.
 * Credentials are loaded from environment variables (see .env).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
