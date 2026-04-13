import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Improved config check: Must be a non-placeholder string
const isReady = 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

// Final Bulletproof Client Initialization
let client = null;

if (isReady) {
  try {
    // Explicitly check if createClient is available to prevent ReferenceError
    if (typeof createClient === 'function') {
      client = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.error('Supabase: createClient function is missing from the bundle.');
    }
  } catch (err) {
    console.error('Supabase: Initialization crash prevented:', err);
  }
}

export const supabase = client;
