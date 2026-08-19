-- ============================================
-- FIX: Production database missing objects
-- Execute este script no Supabase SQL Editor
-- do projeto cnawymsaozndrfbuysar
-- ============================================

-- 1) Add missing 'pending' value to ticket_status enum
ALTER TYPE ticket_status ADD VALUE 'pending';

-- 2) Create missing RPC function
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

-- 3) Add missing categories
INSERT INTO ticket_categories (name, icon) VALUES
  ('Telefone VoiP', 'Phone'),
  ('Smartphone Software', 'Smartphone'),
  ('Desenvolvimento APP', 'Code'),
  ('Manutencao', 'Wrench'),
  ('Teste de Hardware', 'Cpu')
ON CONFLICT DO NOTHING;

-- 4) Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
