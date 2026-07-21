-- ============================================
-- Fix: Recreate on_auth_user_created trigger
-- The trigger was dropped; this restores it.
-- ============================================

-- First, ensure the function exists with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Ensure default admin user profile exists
-- (User already created via GoTrue, just ensure profile row exists)
-- ============================================
INSERT INTO profiles (id, full_name, role, department_id)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'admin',
  (SELECT id FROM departments WHERE name = 'TI' LIMIT 1)
FROM auth.users au
WHERE au.email = 'wellington.s@galvanizacaoraitz.com.br'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  department_id = EXCLUDED.department_id;

-- ============================================
-- Custom Fields: Add custom_fields column to tickets
-- ============================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- ============================================
-- Custom Fields Settings: store field definitions
-- key = 'custom_field_definitions', value = JSON array of field configs
-- Example: [{"name":"patrimonio","label":"Patrimonio","type":"text","required":false}]
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('custom_field_definitions', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;
