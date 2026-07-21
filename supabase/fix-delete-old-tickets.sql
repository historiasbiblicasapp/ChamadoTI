-- Remover todos os chamados importados do sistema antigo (ticket_number comecando com 47)
-- Execute no Supabase SQL Editor

-- Primeiro remover dependentes
DELETE FROM ticket_files
WHERE ticket_id IN (
  SELECT id FROM tickets WHERE CAST(ticket_number AS TEXT) LIKE '47%'
);

DELETE FROM ticket_history
WHERE ticket_id IN (
  SELECT id FROM tickets WHERE CAST(ticket_number AS TEXT) LIKE '47%'
);

DELETE FROM ticket_comments
WHERE ticket_id IN (
  SELECT id FROM tickets WHERE CAST(ticket_number AS TEXT) LIKE '47%'
);

-- Remover os tickets
DELETE FROM tickets
WHERE CAST(ticket_number AS TEXT) LIKE '47%';
