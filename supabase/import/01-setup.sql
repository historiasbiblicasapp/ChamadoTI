-- ============================================
-- PASSO 1: Categorias e Departamentos
-- ============================================

-- INSTRUCOES:
-- 1. Execute migration.sql PRIMEIRO
-- 2. Copie o UUID do seu usuario admin no Supabase
-- 3. Use Ctrl+H para substituir 8b83f559-18cb-4a9c-80f4-58bf3a39cc83 em TODOS os arquivos
-- 4. Execute em ordem: 01-setup, 02-tickets-*, 03-finalize

-- Categories
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Website', 'Globe') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Desenvolvimento', 'Code') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Certificado Digital', 'FileText') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Rede - Ponto', 'Network') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Internet', 'Globe') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Software', 'Disc') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Outro', 'HelpCircle') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Internet - Lentidao', 'Globe') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Audio', 'Volume2') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'iPad', 'Tablet') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Catraca', 'Lock') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Hardware - Computador', 'Monitor') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'E-mail', 'Mail') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Impressora', 'Printer') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Webcam', 'Camera') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'CFTV - Cameras', 'Camera') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Celular', 'Smartphone') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Nobreak', 'Battery') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Compras de TI', 'ShoppingCart') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Wi-Fi', 'Wifi') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Backup', 'HardDrive') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Sistema de Chamados', 'AppWindow') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Hardware - Perifericos', 'Mouse') ON CONFLICT DO NOTHING;
INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), 'Seguranca - Virus', 'Shield') ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (name, description) VALUES ('TI', 'Departamento TI') ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (name, description) VALUES ('Administrativo', 'Departamento Administrativo') ON CONFLICT (name) DO NOTHING;

-- Verifique: SELECT COUNT(*) FROM ticket_categories; SELECT COUNT(*) FROM departments;