-- ============================================
-- STEP 1: Verificar se o usuario existe
-- ============================================
SELECT id, email FROM auth.users WHERE id = '0fd0ab30-205f-4586-8007-a283d46c9266';

-- ============================================
-- STEP 2: Criar profile explicitamente
-- (so rode SE o step 1 retornou resultado)
-- ============================================
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
VALUES ('0fd0ab30-205f-4586-8007-a283d46c9266', 'Wellington Augusto', 'admin'::user_role, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role, full_name = 'Wellington Augusto', updated_at = NOW();

-- ============================================
-- STEP 3: Migrar tickets
-- ============================================
UPDATE tickets SET requester_id = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE requester_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

UPDATE tickets SET assigned_to = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE assigned_to = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- ============================================
-- STEP 4: Limpar usuario antigo
-- ============================================
DELETE FROM auth.refresh_tokens WHERE user_id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM auth.users WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';
DELETE FROM profiles WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- ============================================
-- STEP 5: Verificar
-- ============================================
SELECT id, email FROM auth.users;
SELECT id, full_name, role FROM profiles;
