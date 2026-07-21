UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'wellington.s@galvanizacaoraitz.com.br'
  AND email_confirmed_at IS NULL;
