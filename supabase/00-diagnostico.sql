-- ============================================
-- DIAGNOSTICO - Verificar estado do auth
-- ============================================

-- 1. Todos os usuarios em auth.users
SELECT id, email, created_at, email_confirmed_at IS NOT NULL as confirmed 
FROM auth.users ORDER BY created_at;

-- 2. Todos os profiles
SELECT id, full_name, role FROM profiles ORDER BY created_at;

-- 3. Verificar se o trigger existe e esta ativo
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Verificar se a funcao handle_new_user existe
SELECT proname, proowner::regrole, prosecdef
FROM pg_proc WHERE proname = 'handle_new_user';

-- 5. Verificar FK constraints da tabela profiles
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass AND contype = 'f';
