-- 1. Ver quais profiles sao orfas (sem usuario no auth.users)
SELECT p.id, p.full_name, p.role
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;

-- 2. Deletar profiles orfas
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 3. Garantir pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Resetar senha do admin
UPDATE auth.users
SET encrypted_password = crypt('zincoraitz', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'wellington.s@galvanizacaoraitz.com.br';

-- 5. Garantir que o profile do admin existe
INSERT INTO profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'admin'
FROM auth.users
WHERE email = 'wellington.s@galvanizacaoraitz.com.br'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.users.id)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 6. Verificar usuario
SELECT email,
  (encrypted_password = crypt('zincoraitz', encrypted_password)) as senha_ok
FROM auth.users
WHERE email = 'wellington.s@galvanizacaoraitz.com.br';
