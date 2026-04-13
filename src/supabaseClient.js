import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Improved config check: Must be a non-placeholder string
const isReady = 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

export const supabase = isReady 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn('Supabase Client: Initialized in Local/Demo mode.');
}
