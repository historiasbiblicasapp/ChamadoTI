-- ============================================
-- 1) Remover policies existentes (profiles primeiro)
-- ============================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('profiles','departments','ticket_categories','tickets','ticket_comments','ticket_files','ticket_history','assets','maintenance','knowledge_base','notifications','settings','audit_logs','sla_rules')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================
-- 2) Recriar funcao segura
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon, authenticated;

-- ============================================
-- 3) Recriar policies RLS
-- ============================================
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view categories" ON ticket_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON ticket_categories FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT
  USING (requester_id = auth.uid());
CREATE POLICY "Analysts and admins can view all tickets" ON tickets FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));
CREATE POLICY "Users can create tickets" ON tickets FOR INSERT
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Analysts and admins can update tickets" ON tickets FOR UPDATE
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));
CREATE POLICY "Users can update own open tickets" ON tickets FOR UPDATE
  USING (requester_id = auth.uid() AND status IN ('open', 'waiting_user'));

CREATE POLICY "Users can view comments on accessible tickets" ON ticket_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_comments.ticket_id
    AND (t.requester_id = auth.uid()
      OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));
CREATE POLICY "Users can add comments on accessible tickets" ON ticket_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can view files on accessible tickets" ON ticket_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_files.ticket_id
    AND (t.requester_id = auth.uid()
      OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));
CREATE POLICY "Users can upload files to accessible tickets" ON ticket_files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Analysts can view ticket history" ON ticket_history FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));
CREATE POLICY "System can create ticket history" ON ticket_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view all assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage assets" ON assets FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "Users can view maintenance" ON maintenance FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage maintenance" ON maintenance FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "Users can view published articles" ON knowledge_base FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage articles" ON knowledge_base FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON settings FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "System can create audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view SLA rules" ON sla_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage SLA rules" ON sla_rules FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ============================================
-- 4) RPC dashboard
-- ============================================
DROP FUNCTION IF EXISTS get_tickets_by_month(INTEGER);

CREATE OR REPLACE FUNCTION get_tickets_by_month(months_count INT DEFAULT 12)
RETURNS TABLE(month TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT to_char(t.created_at, 'YYYY-MM') AS month, COUNT(*)::BIGINT AS count
  FROM tickets t
  WHERE t.created_at >= NOW() - (months_count || ' months')::INTERVAL
  GROUP BY to_char(t.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tickets_by_month(INT) TO anon, authenticated;

-- ============================================
-- 5) Garantir colunas pendentes no banco
-- ============================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

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
