import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// v18.2: Indestructible Client Guard
const isConfigValid = !!(supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey && supabaseAnonKey.length > 20);

let supabaseInstance = null;
if (isConfigValid) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("VTSP: Supabase Init Failed", err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;
