-- ============================================
-- CORRIGIR Usuario Admin
-- ============================================
-- O problema: usuario foi criado via SQL direto
-- e o GoTrue nao reconhece. Vamos corrigir
-- atualizando os campos corretos.
-- ============================================

DO $$
DECLARE
  correct_instance_id UUID;
  admin_id UUID := '946dae83-62d5-4382-b497-45c8917f1d0c';
BEGIN
  -- Find the correct instance_id
  SELECT id INTO correct_instance_id FROM auth.instances LIMIT 1;
  IF correct_instance_id IS NULL THEN
    correct_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  RAISE NOTICE 'Instance ID: %', correct_instance_id;

  -- Update user in auth.users
  UPDATE auth.users SET
    instance_id = correct_instance_id,
    encrypted_password = crypt('Admin@123456', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmation_token = '',
    recovery_token = '',
    is_super_admin = false,
    raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object(
        'full_name', 'Wellington Augusto',
        'role', 'admin'
      ),
    updated_at = NOW()
  WHERE id = admin_id;

  IF FOUND THEN
    RAISE NOTICE 'Usuario atualizado com sucesso!';
  ELSE
    RAISE NOTICE 'Usuario nao encontrado - sera criado novo usuario...';
    -- Fallback: create via a workaround that bypasses the trigger
    -- by using SECURITY DEFINER function
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      correct_instance_id, admin_id, 'authenticated', 'authenticated',
      'wellington.s@galvanizacaoraitz.com.br',
      crypt('Admin@123456', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', 'Wellington Augusto', 'role', 'admin'),
      NOW(), NOW(), '', ''
    )
    ON CONFLICT (id) DO UPDATE SET
      instance_id = correct_instance_id,
      encrypted_password = crypt('Admin@123456', gen_salt('bf')),
      email_confirmed_at = NOW(),
      updated_at = NOW();
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: wellington.s@galvanizacaoraitz.com.br';
  RAISE NOTICE 'Senha: Admin@123456';
  RAISE NOTICE '========================================';
END $$;
