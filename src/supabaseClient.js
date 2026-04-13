import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Strict verification to prevent "Black Screen" crash on production
const isValidConfig = 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 30 && 
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

if (!isValidConfig && import.meta.env.PROD) {
  console.warn("VTSP PRODUCTION WARN: Supabase connection is NOT configured!");
}

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
