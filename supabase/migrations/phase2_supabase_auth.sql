-- ============================================================
-- Phase 2: Migrate to Supabase Auth
-- Project: VTSP Incident Reporter
-- ============================================================
-- INSTRUCTIONS — Run in order:
--
-- STEP 0 (Dashboard / Auth API — do BEFORE running this SQL):
--   Create 2 users in Supabase Authentication:
--   1) Email: admin@vtsp.internal
--      Password: (ตั้งตามต้องการ)
--      Raw user_metadata (JSON):
--        { "username": "admin", "display_name": "หัวหน้างานกะ" }
--
--   2) Email: apronhkt@vtsp.internal
--      Password: (ตั้งตามต้องการ)
--      Raw user_metadata (JSON):
--        { "username": "apronhkt", "display_name": "เจ้าหน้าที่" }
--
-- STEP 1: Run Section A (add columns + populate)
-- STEP 2: Verify — check results of the SELECT at the end of Section A
-- STEP 3: Run Section B (rename, constraints, RLS)
-- STEP 4: Run Section C (cleanup old auth infrastructure)
-- ============================================================


-- ============================================================
-- SECTION A: Add UUID columns and populate from auth.users
-- ============================================================

-- incident_history
ALTER TABLE public.incident_history
  ADD COLUMN IF NOT EXISTS new_user_id UUID;

-- user_templates
ALTER TABLE public.user_templates
  ADD COLUMN IF NOT EXISTS new_user_id UUID;

-- user_folders (may not exist yet — CREATE IF NOT EXISTS for safety)
CREATE TABLE IF NOT EXISTS public.user_folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  mode        TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  is_expanded BOOLEAN DEFAULT true,
  parent_id   UUID REFERENCES public.user_folders(id) ON DELETE SET NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.user_folders
  ADD COLUMN IF NOT EXISTS new_user_id UUID;

-- Populate new_user_id by matching username@vtsp.internal → auth.users.id
UPDATE public.incident_history ih
SET    new_user_id = au.id
FROM   auth.users au
WHERE  au.email = ih.user_id || '@vtsp.internal';

UPDATE public.user_templates ut
SET    new_user_id = au.id
FROM   auth.users au
WHERE  au.email = ut.user_id || '@vtsp.internal';

UPDATE public.user_folders uf
SET    new_user_id = au.id
FROM   auth.users au
WHERE  au.email = uf.user_id || '@vtsp.internal';

-- ⚠️ VERIFY before proceeding to Section B
-- The queries below must return 0 rows (no orphaned records).
-- If any row returns count > 0, the auth user for that username was NOT created yet.
--
-- SELECT 'incident_history' AS tbl, COUNT(*) AS missing
--   FROM public.incident_history
--   WHERE new_user_id IS NULL AND user_id IS NOT NULL
-- UNION ALL
-- SELECT 'user_templates', COUNT(*)
--   FROM public.user_templates
--   WHERE new_user_id IS NULL AND user_id IS NOT NULL
-- UNION ALL
-- SELECT 'user_folders', COUNT(*)
--   FROM public.user_folders
--   WHERE new_user_id IS NULL AND user_id IS NOT NULL;


-- ============================================================
-- SECTION B: Swap columns + Enable real RLS
-- ============================================================

-- incident_history: drop old TEXT user_id → promote new UUID
ALTER TABLE public.incident_history DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.incident_history RENAME COLUMN new_user_id TO user_id;
ALTER TABLE public.incident_history ALTER COLUMN user_id SET NOT NULL;

-- user_templates: same swap
ALTER TABLE public.user_templates DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_templates RENAME COLUMN new_user_id TO user_id;
ALTER TABLE public.user_templates ALTER COLUMN user_id SET NOT NULL;

-- user_folders: same swap
ALTER TABLE public.user_folders DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_folders RENAME COLUMN new_user_id TO user_id;
ALTER TABLE public.user_folders ALTER COLUMN user_id SET NOT NULL;

-- Enable RLS on all tables
ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_folders      ENABLE ROW LEVEL SECURITY;

-- Drop old permissive (USING true) policies on user_templates
DROP POLICY IF EXISTS "Users can view their own templates"   ON public.user_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.user_templates;

-- Create strict RLS policies (auth.uid() = user_id)
CREATE POLICY "own_history"
  ON public.incident_history FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

CREATE POLICY "own_templates"
  ON public.user_templates FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

CREATE POLICY "own_folders"
  ON public.user_folders FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ============================================================
-- SECTION C: Remove old custom auth infrastructure
-- ============================================================

DROP FUNCTION IF EXISTS public.verify_user(text, text);
DROP FUNCTION IF EXISTS public.create_account(text, text, text);
DROP TABLE IF EXISTS public.app_accounts;
DROP EXTENSION IF EXISTS pgcrypto;  -- safe to drop if not used elsewhere
