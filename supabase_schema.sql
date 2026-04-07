-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create custom accounts table for true Username/Password (No Email required)
CREATE TABLE IF NOT EXISTS public.app_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    display_name text,
    role text DEFAULT 'staff',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create incident history table (Modified to link with app_accounts)
CREATE TABLE IF NOT EXISTS public.incident_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mode text NOT NULL,
    template_name text,
    preview text,
    extra_preview text,
    data jsonb DEFAULT '{}'::jsonb,
    user_id text, -- Can be username or account ID string
    saved_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RPC: verify_user - A secure way to check login without Email
-- To be called as: supabase.rpc('verify_user', { p_username: '...', p_password: '...' })
CREATE OR REPLACE FUNCTION verify_user(p_username text, p_password text)
RETURNS TABLE (
    id uuid,
    username text,
    display_name text,
    role text,
    success boolean
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, 
        a.username, 
        a.display_name, 
        a.role,
        (a.password_hash = crypt(p_password, a.password_hash)) as success
    FROM public.app_accounts a
    WHERE a.username = p_username;
END;
$$;

-- 5. Helper Function: create_user - For adding users safely in SQL editor
-- Use: SELECT create_account('admin', 'password123', 'หัวหน้างานกะ');
CREATE OR REPLACE FUNCTION create_account(p_username text, p_password text, p_display_name text DEFAULT '')
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO public.app_accounts (username, password_hash, display_name)
    VALUES (p_username, crypt(p_password, gen_salt('bf')), p_display_name);
END;
$$;

-- Initial Setup: Add an admin account
-- SELECT create_account('admin', 'admin', 'แอดมิน');
