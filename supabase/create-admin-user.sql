-- ============================================
-- Criar Usuario Admin via SQL
-- ============================================
-- 1. Abra o Supabase SQL Editor
-- 2. Cole TODO este script
-- 3. Ajuste email/senha conforme necessario
-- 4. Execute
-- ============================================

DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
  admin_email TEXT := 'wellington.s@galvanizacaoraitz.com.br';
  admin_password TEXT := 'Admin@123456';
  admin_name TEXT := 'Wellington Augusto';
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_uuid,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'full_name', admin_name,
      'role', 'admin',
      'department', 'Infraestrutura de TI'
    ),
    NOW(),
    NOW()
  );

  INSERT INTO profiles (id, full_name, role, created_at, updated_at)
  VALUES (admin_uuid, admin_name, 'admin'::user_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Usuario criado com sucesso!';
  RAISE NOTICE 'UUID: %', admin_uuid;
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Senha: %', admin_password;
  RAISE NOTICE 'Role: admin';
  RAISE NOTICE '========================================';
END $$;
