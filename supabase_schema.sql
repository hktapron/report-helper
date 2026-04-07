-- SQL to create the incident_history table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.incident_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT,
    preview_thai TEXT,
    preview_extra TEXT,
    form_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (Optional: but recommended)
ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own history" 
ON public.incident_history FOR ALL 
USING (auth.uid() = user_id);
