-- Diagnóstico: tickets que podem estar com relacionamentos quebrados
-- Rode no Supabase Dashboard > SQL Editor

SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.status,
  t.requester_id,
  p_requester.full_name AS requester_name,
  t.assigned_to,
  p_assignee.full_name AS assignee_name
FROM tickets t
LEFT JOIN profiles p_requester ON p_requester.id = t.requester_id
LEFT JOIN profiles p_assignee ON p_assignee.id = t.assigned_to
ORDER BY t.created_at DESC
LIMIT 20;
