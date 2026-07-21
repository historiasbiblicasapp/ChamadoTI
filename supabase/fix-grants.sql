-- Grant table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_history TO authenticated;
GRANT SELECT, INSERT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON ticket_categories TO authenticated;
GRANT SELECT ON assets TO authenticated;
GRANT SELECT ON maintenance TO authenticated;
GRANT SELECT ON knowledge_base TO authenticated;
GRANT INSERT ON knowledge_base TO authenticated;
GRANT UPDATE ON knowledge_base TO authenticated;
GRANT DELETE ON knowledge_base TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;
GRANT SELECT ON settings TO authenticated;
GRANT SELECT ON sla_rules TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- Also grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
