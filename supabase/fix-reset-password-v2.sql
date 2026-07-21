-- 1. Garantir pgcrypto habilitado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Verificar se o usuario existe
SELECT id, email, encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'wellington.s@galvanizacaoraitz.com.br';

-- 3. Resetar a senha
UPDATE auth.users
SET encrypted_password = crypt('zincoraitz', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'wellington.s@galvanizacaoraitz.com.br';

-- 4. Verificar se funcionou
SELECT id, email,
  (encrypted_password = crypt('zincoraitz', encrypted_password)) as password_matches
FROM auth.users
WHERE email = 'wellington.s@galvanizacaoraitz.com.br';
