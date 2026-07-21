-- Investigar schema do auth
SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' ORDER BY table_name;

-- Verificar se ha funcoes ou views quebradas
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'auth' ORDER BY routine_name;

-- Verificar triggers em auth.users
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Contar tudo em auth.users
SELECT count(*) as total_users FROM auth.users;

-- Verificar se o handle_new_user esta causando problema
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
