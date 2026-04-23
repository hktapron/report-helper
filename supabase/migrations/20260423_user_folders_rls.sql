-- RLS for user_folders (same pattern as user_templates applied 2026-04-23)
-- Shared DB: everyone sees all folders, only supervisor/admin can delete

ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_read_all" ON user_folders FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "folders_insert_stamped" ON user_folders FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "folders_update_all" ON user_folders FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "folders_delete_elevated" ON user_folders FOR DELETE
  TO authenticated USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('supervisor', 'admin')
  );
