-- Deletar o usuario corrompido do auth.users
-- Isso bypassa o GoTrue completamente
DELETE FROM auth.refresh_tokens WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.instances WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.mfa_factors WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.sso_sessions WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.sessions WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.one_time_tokens WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Desabilitar trigger antes de deletar para evitar conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DELETE FROM auth.users WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verificar
SELECT count(*) as usuarios_restantes FROM auth.users;
