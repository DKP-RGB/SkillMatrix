import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Robust check for valid Supabase credentials to prevent app crash
const isValidUrl = (url) => {
    try {
        new URL(url);
        return !url.includes('your_supabase_url_here');
    } catch {
        return false;
    }
};

const isValidKey = (key) => key && !key.includes('your_supabase_anon_key_here');

export const supabase = (isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey))
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => { throw new Error("Supabase URL/Key not configured in .env") },
            signUp: async () => { throw new Error("Supabase URL/Key not configured in .env") },
            signInWithOAuth: async () => { throw new Error("Supabase URL/Key not configured in .env") },
            signOut: async () => ({ error: null })
        }
    };

if (!isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey)) {
    console.error('CRITICAL: Supabase credentials missing or invalid in .env. Authentication will NOT function.');
}
