-- Phase 27: Centralized App Settings for AI Key & Other Configs
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users (so operation can use Gemini)
CREATE POLICY "Allow read for authenticated" ON public.app_settings
    FOR SELECT TO authenticated USING (true);

-- Allow all for admins
CREATE POLICY "Allow all for admins" ON public.app_settings
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Insert initial empty key if not exists
INSERT INTO public.app_settings (key, value) 
VALUES ('gemini_api_key', '')
ON CONFLICT (key) DO NOTHING;
