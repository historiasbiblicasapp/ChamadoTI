-- Verificar estrutura completa da tabela auth.users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar tabelas que existem no schema auth
SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' ORDER BY table_name;

-- Verificar constraints
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE connamespace = 'auth'::regnamespace
ORDER BY contype, conname;

-- Verificar se ha colunas faltando que o GoTrue espera
SELECT 
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='instance_id') as has_instance_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='encrypted_password') as has_encrypted_password,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='email_confirmed_at') as has_email_confirmed,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='is_super_admin') as has_super_admin,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='is_sso_user') as has_sso_user;

-- Verificar se auth.instances esta OK
SELECT * FROM auth.instances;

-- Verificar extensao do GoTrue
SELECT * FROM auth.schema_migrations ORDER BY version DESC LIMIT 10;
