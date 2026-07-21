-- Descobrir o UUID real do usuario
SELECT id, email, created_at, email_confirmed_at IS NOT NULL as confirmed 
FROM auth.users 
WHERE email = 'wellington.s@galvanizacaoraitz.com.br';

-- Todos os usuarios
SELECT id, email FROM auth.users;
