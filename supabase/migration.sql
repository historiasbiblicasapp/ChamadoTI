-- ============================================
-- NetVision HelpDesk - Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'open', 'in_progress', 'waiting_user', 'waiting_parts',
    'waiting_supplier', 'resolved', 'closed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM ('active', 'maintenance', 'retired', 'in_stock');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('pending', 'completed', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'user',
  department_id UUID,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Categories
CREATE TABLE IF NOT EXISTS ticket_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES ticket_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets (must be before tickets)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patrimony TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  ip_address TEXT,
  mac_address TEXT,
  location TEXT,
  department_id UUID REFERENCES departments(id),
  user_id UUID REFERENCES profiles(id),
  operating_system TEXT,
  processor TEXT,
  ram_memory TEXT,
  storage TEXT,
  warranty_date DATE,
  notes TEXT,
  status asset_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK to profiles for department
ALTER TABLE profiles ADD CONSTRAINT profiles_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number SERIAL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  category_id UUID REFERENCES ticket_categories(id),
  subcategory TEXT,
  requester_id UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  department_id UUID REFERENCES departments(id),
  location TEXT,
  phone TEXT,
  asset_id UUID REFERENCES assets(id),
  root_cause TEXT,
  solution_applied TEXT,
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Ticket Comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Files
CREATE TABLE IF NOT EXISTS ticket_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket History
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  periodicity TEXT,
  last_maintenance DATE,
  next_maintenance DATE,
  status maintenance_status DEFAULT 'pending',
  technician_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  author_id UUID REFERENCES profiles(id),
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  reference_id UUID,
  reference_type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA Rules
CREATE TABLE IF NOT EXISTS sla_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority ticket_priority UNIQUE NOT NULL,
  hours INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_files_ticket ON ticket_files(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_assets_patrimony ON assets(patrimony);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- NOTE: Create your admin user BEFORE running this trigger.
-- The trigger will fail if profiles table has FK issues.
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER: Auto-log ticket changes
-- ============================================

CREATE OR REPLACE FUNCTION log_ticket_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, NEW.assigned_to, 'status_changed', OLD.status::text, NEW.status::text);
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, NEW.assigned_to, 'assigned_changed',
      OLD.assigned_to::text, NEW.assigned_to::text);
  END IF;

  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, NEW.assigned_to, 'priority_changed', OLD.priority::text, NEW.priority::text);
  END IF;

  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;

  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_update ON tickets;
CREATE TRIGGER on_ticket_update
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_ticket_changes();

-- ============================================
-- TRIGGER: Create history on comment
-- ============================================

CREATE OR REPLACE FUNCTION log_comment_added()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_history (ticket_id, user_id, action, new_value)
  VALUES (NEW.ticket_id, NEW.author_id, 'comment_added', LEFT(NEW.content, 200));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_added ON ticket_comments;
CREATE TRIGGER on_comment_added
  AFTER INSERT ON ticket_comments
  FOR EACH ROW EXECUTE FUNCTION log_comment_added();

-- ============================================
-- RPC: Get profile ID by email
-- ============================================

CREATE OR REPLACE FUNCTION public.get_profile_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = p_email
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_id_by_email(TEXT) TO anon, authenticated;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_rules ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Departments policies
CREATE POLICY "Users can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Categories policies
CREATE POLICY "Users can view categories" ON ticket_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON ticket_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT
  USING (requester_id = auth.uid());
CREATE POLICY "Analysts and admins can view all tickets" ON tickets FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')));
CREATE POLICY "Users can create tickets" ON tickets FOR INSERT
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Analysts and admins can update tickets" ON tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')));
CREATE POLICY "Users can update own open tickets" ON tickets FOR UPDATE
  USING (requester_id = auth.uid() AND status IN ('open', 'waiting_user'));

-- Comments policies
CREATE POLICY "Users can view comments on accessible tickets" ON ticket_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_comments.ticket_id
    AND (t.requester_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')))
  ));
CREATE POLICY "Users can add comments on accessible tickets" ON ticket_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Files policies
CREATE POLICY "Users can view files on accessible tickets" ON ticket_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_files.ticket_id
    AND (t.requester_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')))
  ));
CREATE POLICY "Users can upload files to accessible tickets" ON ticket_files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- History policies
CREATE POLICY "Analysts can view ticket history" ON ticket_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')));

-- Assets policies
CREATE POLICY "Users can view all assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage assets" ON assets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')));

-- Maintenance policies
CREATE POLICY "Users can view maintenance" ON maintenance FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage maintenance" ON maintenance FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')));

-- Knowledge base policies
CREATE POLICY "Users can view published articles" ON knowledge_base FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage articles" ON knowledge_base FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst')));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT
  WITH CHECK (true);

-- Settings policies
CREATE POLICY "Users can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can create audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- SLA rules policies
CREATE POLICY "Users can view SLA rules" ON sla_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage SLA rules" ON sla_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- INITIAL DATA
-- ============================================

-- Default SLA rules
INSERT INTO sla_rules (priority, hours) VALUES
  ('low', 48),
  ('medium', 24),
  ('high', 8),
  ('critical', 2)
ON CONFLICT (priority) DO NOTHING;

-- Default departments
INSERT INTO departments (name, description) VALUES
  ('TI', 'Tecnologia da Informacao'),
  ('RH', 'Recursos Humanos'),
  ('Financeiro', 'Departamento Financeiro'),
  ('Comercial', 'Departamento Comercial'),
  ('Administrativo', 'Departamento Administrativo'),
  ('Operacoes', 'Departamento de Operacoes')
ON CONFLICT (name) DO NOTHING;

-- Default categories
INSERT INTO ticket_categories (name, icon) VALUES
  ('Computador', 'Monitor'),
  ('Notebook', 'Laptop'),
  ('Monitor', 'Monitor'),
  ('Impressora', 'Printer'),
  ('Rede', 'Network'),
  ('Internet', 'Globe'),
  ('Wi-Fi', 'Wifi'),
  ('Telefonia', 'Phone'),
  ('Windows', 'Monitor'),
  ('Microsoft Office', 'FileText'),
  ('E-mail', 'Mail'),
  ('ERP', 'Database'),
  ('Sistema Interno', 'AppWindow'),
  ('Hardware', 'Cpu'),
  ('Software', 'Disc'),
  ('Servidor', 'Server'),
  ('Backup', 'HardDrive'),
  ('Seguranca', 'Shield'),
  ('Outro', 'HelpCircle')
ON CONFLICT DO NOTHING;

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('company_name', '"Minha Empresa"'),
  ('company_phone', '""'),
  ('company_email', '""'),
  ('theme', '"dark"'),
  ('language', '"pt-BR"')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Run this in Supabase Dashboard > Storage > New Bucket
-- Bucket name: ticket-files
-- Public: false

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for notifications and comments
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
