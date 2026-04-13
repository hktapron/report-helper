import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// v17: Zero-Crash Initialization Strategy
const validateConfig = () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    if (!supabaseUrl.startsWith('http')) return false;
    if (supabaseAnonKey.length < 30) return false;
    if (supabaseUrl.includes('YOUR_SUPABASE_URL')) return false;
    return true;
  } catch (e) {
    return false;
  }
};

const isValid = validateConfig();

let supabaseInstance = null;
if (isValid) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("VTSP FAILSAFE: Failed to initialize Supabase client.", e);
    supabaseInstance = null;
  }
}

if (!supabaseInstance && import.meta.env.PROD) {
  console.warn("VTSP PRODUCTION WARN: Database connection is inactive. Falling back to Demo Mode.");
}

export const supabase = supabaseInstance;
