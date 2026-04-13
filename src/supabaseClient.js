import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Definitive safety check for production restoration
const isValidConfig = 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 20;

if (!isValidConfig && import.meta.env.PROD) {
  console.error("VTSP ALERT: Supabase Configuration Missing! Check Vercel Environment Variables.");
}

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
