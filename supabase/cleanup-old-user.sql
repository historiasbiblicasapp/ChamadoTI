-- ============================================
-- LIMPAR usuario antigo corrompido do auth.users
-- ============================================

-- Deletar refresh tokens do usuario antigo
DELETE FROM auth.refresh_tokens 
WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Deletar session data se existir
DELETE FROM auth.sessions 
WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Deletar mfa factors se existir
DELETE FROM auth.mfa_factors 
WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Deletar o usuario antigo corrompido
DELETE FROM auth.users 
WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Deletar profile antigo
DELETE FROM profiles 
WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Verificar se o novo usuario existe
SELECT 'Novo usuario:' as info, id, email, confirmed_at FROM auth.users 
WHERE id = '0fd0ab30-205f-4586-8007-a283d46c9266';

-- Verificar se o profile do novo usuario existe
SELECT 'Novo profile:' as info, id, full_name, role FROM profiles 
WHERE id = '0fd0ab30-205f-4586-8007-a283d46c9266';
