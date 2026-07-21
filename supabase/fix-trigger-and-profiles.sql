-- ============================================
-- FIX COMPLETO - Desabilitar trigger + setup
-- ============================================

-- 1. DESABILITAR o trigger que pode estar causando 500
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Ver quem esta em auth.users
SELECT id, email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users;

-- 3. Para cada usuario em auth.users que NAO tem profile, criar o profile
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'user'),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Garantir que o usuario 0fd0ab30 tem role admin
UPDATE profiles SET role = 'admin' WHERE id = '0fd0ab30-205f-4586-8007-a283d46c9266';

-- 5. Listar profiles para confirmar
SELECT id, full_name, role FROM profiles;
