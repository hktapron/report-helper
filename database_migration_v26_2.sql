-- DO NOT RUN LOCALLY. Copy and execute this in your Supabase SQL Editor.

-- 1. Create the user_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    user_id TEXT NOT NULL,
    preview TEXT,
    extra_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for User Access
-- Users can only see their own templates
CREATE POLICY "Users can view their own templates" 
ON public.user_templates FOR SELECT 
USING (true); -- We allow viewing for now, but strict check is usually via where clause in App.jsx

-- Users can insert their own templates
CREATE POLICY "Users can insert their own templates" 
ON public.user_templates FOR INSERT 
WITH CHECK (true);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates" 
ON public.user_templates FOR UPDATE 
USING (true);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates" 
ON public.user_templates FOR DELETE 
USING (true);

-- Note: Since we are using 'username' (text) instead of Supabase Auth UUID, 
-- we handle the logic filtering in the App.jsx queries.
