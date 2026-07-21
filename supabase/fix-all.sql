-- ============================================
-- FIX COMPLETO - RODAR APENAS ESTE ARQUIVO
-- ============================================

-- 1. Desabilitar trigger problemático
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Criar profiles que faltam (incluindo o novo UUID)
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

-- 3. Garantir que o novo UUID tem role admin
UPDATE profiles SET role = 'admin' WHERE id = '0fd0ab30-205f-4586-8007-a283d46c9266';

-- 4. Migrar tickets para o novo UUID
UPDATE tickets SET requester_id = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE requester_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

UPDATE tickets SET assigned_to = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE assigned_to = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- 5. Agora sim pode deletar o usuario e profile antigos
DELETE FROM auth.refresh_tokens WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.users WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM profiles WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- 6. Verificar resultado
SELECT 'auth.users:' as tabela, count(*)::text as total FROM auth.users
UNION ALL
SELECT 'profiles:', count(*)::text FROM profiles
UNION ALL
SELECT 'tickets com requester 0fd0:', count(*)::text FROM tickets WHERE requester_id = '0fd0ab30-205f-4586-8007-a283d46c9266';
