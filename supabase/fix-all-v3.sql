-- ============================================
-- FIX FINAL - Cria usuario + profile + migra
-- ============================================

-- 1. Desabilitar trigger para evitar conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Criar usuario em auth.users (goTrue nao precisa estar envolvido)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '0fd0ab30-205f-4586-8007-a283d46c9266',
  'authenticated',
  'authenticated',
  'wellington.s@galvanizacaoraitz.com.br',
  crypt('Admin@123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Wellington Augusto","role":"admin"}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('Admin@123456', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW();

-- 3. Criar profile
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
VALUES ('0fd0ab30-205f-4586-8007-a283d46c9266', 'Wellington Augusto', 'admin'::user_role, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role, updated_at = NOW();

-- 4. Migrar tickets
UPDATE tickets SET requester_id = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE requester_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

UPDATE tickets SET assigned_to = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE assigned_to = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- 5. Limpar usuario antigo
DELETE FROM auth.refresh_tokens WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.users WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM profiles WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- 6. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Verificar
SELECT 'auth.users:' as info, id::text, email FROM auth.users
UNION ALL
SELECT 'profiles:', id::text, full_name FROM profiles;
