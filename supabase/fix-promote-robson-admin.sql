-- Promover usuario robson@molligit.com.br para admin
-- Execute no Supabase SQL Editor

UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'robson@molligit.com.br'
);

-- Se o usuario ainda nao tiver profile (nunca logou), cria um
INSERT INTO profiles (id, full_name, role)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Robson'),
  'admin'
FROM auth.users au
WHERE au.email = 'robson@molligit.com.br'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
