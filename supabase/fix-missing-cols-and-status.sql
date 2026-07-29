-- ============================================
-- Foco: apenas ajustar o que falta no banco existente
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================

-- 1) Garantir coluna department_id em profiles (aguarda departments existir)
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

-- 2) Garantir colunas em tickets se faltarem
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);

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

-- 3) Atualizar chamados antigos: closed -> resolved
UPDATE tickets
SET status = 'resolved',
    updated_at = NOW()
WHERE status = 'closed';
