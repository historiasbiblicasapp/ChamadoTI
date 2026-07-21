-- Verificar instance_id real
SELECT id, uuid FROM auth.instances;

-- Verificar instance_id do usuario
SELECT id, email, instance_id, encrypted_password IS NOT NULL as has_password, 
       email_confirmed_at IS NOT NULL as confirmed
FROM auth.users WHERE email = 'wellington.s@galvanizacaoraitz.com.br';
