-- Resetar senha do admin para 'zincoraitz'
UPDATE auth.users
SET encrypted_password = crypt('zincoraitz', gen_salt('bf'))
WHERE email = 'wellington.s@galvanizacaoraitz.com.br';
