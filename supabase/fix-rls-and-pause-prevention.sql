-- ============================================
-- 1) Seguranca: evitar recursao em RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- ============================================
-- 2) Ajustar RLS para parar de consultar profiles diretamente
-- ============================================
DROP POLICY IF EXISTS "Profiles view all" ON profiles;
DROP POLICY IF EXISTS "Profiles update own" ON profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins manage departments" ON departments;
DROP POLICY IF EXISTS "Admins manage categories" ON ticket_categories;
DROP POLICY IF EXISTS "Analysts/admins view all tickets" ON tickets;
DROP POLICY IF EXISTS "Analysts/admins update tickets" ON tickets;
DROP POLICY IF EXISTS "View comments on accessible tickets" ON ticket_comments;
DROP POLICY IF EXISTS "View files on accessible tickets" ON ticket_files;
DROP POLICY IF EXISTS "Analysts view ticket history" ON ticket_history;
DROP POLICY IF EXISTS "Admins manage assets" ON assets;
DROP POLICY IF EXISTS "Admins manage maintenance" ON maintenance;
DROP POLICY IF EXISTS "Admins manage knowledge" ON knowledge_base;
DROP POLICY IF EXISTS "Admins manage settings" ON settings;
DROP POLICY IF EXISTS "Admins view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins manage sla_rules" ON sla_rules;

CREATE POLICY "Profiles view all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins manage departments" ON departments FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins manage categories" ON ticket_categories FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Analysts/admins view all tickets" ON tickets FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));
CREATE POLICY "Analysts/admins update tickets" ON tickets FOR UPDATE
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "View comments on accessible tickets" ON ticket_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_comments.ticket_id
      AND (t.requester_id = auth.uid()
           OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));

CREATE POLICY "View files on accessible tickets" ON ticket_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_files.ticket_id
      AND (t.requester_id = auth.uid()
           OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));

CREATE POLICY "Analysts view ticket history" ON ticket_history FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "Admins manage assets" ON assets FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "Admins manage maintenance" ON maintenance FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "Admins manage knowledge" ON knowledge_base FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "Admins manage settings" ON settings FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins manage sla_rules" ON sla_rules FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ============================================
-- 3) Garantir perfil do usuario atual e do admin
-- ============================================
INSERT INTO profiles (id, full_name, role)
SELECT '736d8f34-dfa4-4e27-9f76-0a0e837ef534',
       COALESCE(au.raw_user_meta_data->>'full_name', au.email),
       COALESCE((au.raw_user_meta_data->>'role')::user_role, 'user')
FROM auth.users au
WHERE au.id = '736d8f34-dfa4-4e27-9f76-0a0e837ef534'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- ============================================
-- 4) Garantir que o trigger nao crasha (opcional: disabilitar se quiser)
-- Drop trigger so se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 5) Reativar tracao/vacuum para tabelas grande
-- (apenas se quiser tentar reduzir chance de indisponibilidade em free tier)
-- NOTA: no PostgREST/Supabase free tier nao ha comando SQL para impedir pausa.
-- A forma confiavel é manter pelo menos 1 request por semana ou usar um ping externo.
-- ============================================

SELECT 'RLS fix aplicado' AS status;
