import * as supabaseJs from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Init] Supabase URL exists:', !!supabaseUrl);

// Improved config check: Must be a non-placeholder string
const isReady = 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

// Final Bulletproof Client Initialization
let client = null;

if (isReady && supabaseJs && typeof supabaseJs.createClient === 'function') {
  try {
    client = supabaseJs.createClient(supabaseUrl, supabaseAnonKey);
    console.log('[Init] Supabase Client Created Successfully');
  } catch (err) {
    console.error('[Init] Supabase Setup Crash:', err);
  }
} else {
  console.warn('[Init] Supabase in Demo Mode (Ready:', isReady, ')');
}

export const supabase = client;
