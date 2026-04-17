/* src/services/supabase.js */
import { supabase } from '../supabaseClient';

/**
 * Normalise a Supabase auth user into a standard App User object.
 */
export const formatAuthUser = (authUser) => {
  if (!authUser) return null;
  const email = authUser.email || '';
  const fallback = email.includes('@') ? email.split('@')[0] : 'User';
  return {
    id: authUser.id,
    username: authUser.user_metadata?.username || fallback,
    display_name: authUser.user_metadata?.display_name || fallback,
    role: authUser.user_metadata?.role || 'operation',
  };
};

/**
 * Fetch the active session from Supabase.
 * Returns the normalized user if a session exists.
 */
export const getActiveSession = async () => {
    try {
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user ? formatAuthUser(session.user) : null;
    } catch (e) {
        console.warn("Auth Session Fetch Failed", e);
        return null;
    }
};

/**
 * Logs out the current user.
 */
export const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
};
