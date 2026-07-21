-- ============================================
-- PASSO 3: Reset da sequencia
-- ============================================

SELECT setval('tickets_ticket_number_seq', (SELECT COALESCE(MAX(ticket_number), 0) FROM tickets) + 1);

-- Verificacao final:
-- SELECT COUNT(*) FROM tickets;
-- SELECT status, COUNT(*) FROM tickets GROUP BY status;
-- SELECT category_id, COUNT(*) FROM tickets GROUP BY category_id ORDER BY count DESC;