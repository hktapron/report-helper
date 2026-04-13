import * as supabaseJs from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Improved config check: Must be a non-placeholder string
const isReady = 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

// Robust client initialization
let supabaseClient = null;

if (isReady && supabaseJs && typeof supabaseJs.createClient === 'function') {
  try {
    supabaseClient = supabaseJs.createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Supabase Initialization Error:', err);
  }
} else if (isReady) {
  console.error('CRITICAL: Supabase library loaded but createClient is missing.');
}

export const supabase = supabaseClient;
