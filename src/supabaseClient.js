import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Original simple working pattern from this morning
const isValidConfig = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
