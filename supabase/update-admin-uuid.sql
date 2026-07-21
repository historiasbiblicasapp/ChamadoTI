-- ============================================
-- Atualizar tickets e profile para novo UUID admin
-- ============================================

-- Atualizar requester_id nos tickets
UPDATE tickets SET requester_id = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE requester_id = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Atualizar assigned_to nos tickets
UPDATE tickets SET assigned_to = '0fd0ab30-205f-4586-8007-a283d46c9266' 
WHERE assigned_to = '946dae83-62d5-4382-b497-45c8917f1d0c';

-- Garantir que o profile do novo UUID tem role admin
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
VALUES ('0fd0ab30-205f-4586-8007-a283d46c9266', 'Wellington Augusto', 'admin'::user_role, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin'::user_role,
  full_name = 'Wellington Augusto',
  updated_at = NOW();

-- Deletar profile antigo (se existir e nao forreferenciado por FK)
DELETE FROM profiles WHERE id = '946dae83-62d5-4382-b497-45c8917f1d0c';

SELECT 'Pronto! Tickets atualizados: ' || (SELECT COUNT(*) FROM tickets WHERE requester_id = '0fd0ab30-205f-4586-8007-a283d46c9266') || ' tickets com este requester.';
