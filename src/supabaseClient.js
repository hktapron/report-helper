import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Robust check: ensure URL is a valid string and starts with http (not a placeholder)
const isValidConfig = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

if (!isValidConfig) {
  console.warn('Supabase credentials missing or invalid. App will use localStorage fallback.');
}

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
