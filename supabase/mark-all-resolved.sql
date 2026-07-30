-- Marcar todos os chamados como resolvido pelo admin Wellington
UPDATE tickets
SET status = 'resolved',
    resolved_at = NOW(),
    resolved_by = '736d8f34-dfa4-4e27-9f76-0a0e837ef534',
    updated_at = NOW()
WHERE status <> 'cancelled';

-- Registrar no histórico quem resolveu
INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
SELECT 
  t.id,
  '736d8f34-dfa4-4e27-9f76-0a0e837ef534',
  'status_changed',
  t.status,
  'resolved',
  NOW()
FROM tickets t
WHERE t.status <> 'cancelled'
  AND NOT EXISTS (
    SELECT 1 FROM ticket_history th 
    WHERE th.ticket_id = t.id 
    AND th.action = 'status_changed' 
    AND th.new_value = 'resolved'
    AND th.created_at > NOW() - INTERVAL '1 minute'
  );
