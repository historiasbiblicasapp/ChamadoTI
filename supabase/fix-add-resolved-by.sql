-- Adicionar coluna resolved_by para registrar quem resolveu o chamado
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);

-- Preencher resolved_by dos tickets ja resolvidos com o assignee atual
UPDATE tickets
SET resolved_by = assigned_to
WHERE status IN ('resolved', 'closed') AND resolved_by IS NULL AND assigned_to IS NOT NULL;
