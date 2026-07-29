-- ============================================
-- Corrige estrutura mínima e depois atualiza status
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================

-- 1) Garantir tabelas base mínimas antes de qualquer FK
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES ticket_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Agora sim adicionar/ajustar profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN department_id UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_department_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Criar tickets com tipos seguros
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number SERIAL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
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
  closed_at TIMESTAMPTZ,
  scheduled_date DATE,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  resolved_by UUID
);

-- 4) Demais tabelas necessárias para o app funcionar
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  periodicity TEXT,
  last_maintenance DATE,
  next_maintenance DATE,
  status TEXT DEFAULT 'pending',
  technician_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS sla_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority TEXT UNIQUE NOT NULL,
  hours INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) FK resolvida depois que assets/tickets existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_resolved_by_fkey'
  ) THEN
    ALTER TABLE tickets ADD CONSTRAINT tickets_resolved_by_fkey
      FOREIGN KEY (resolved_by) REFERENCES profiles(id);
  END IF;
END $$;

UPDATE tickets
SET resolved_by = assigned_to
WHERE status IN ('resolved', 'closed') AND resolved_by IS NULL AND assigned_to IS NOT NULL;

-- 6) Atualizar todos os chamados para resolvido
UPDATE tickets
SET status = 'resolved',
    resolved_at = COALESCE(resolved_at, NOW()),
    resolved_by = COALESCE(resolved_by, assigned_to),
    updated_at = NOW()
WHERE status <> 'cancelled';
