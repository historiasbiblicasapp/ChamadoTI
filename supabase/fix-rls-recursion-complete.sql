-- ============================================
-- FIX RLS: recursão infinita em profiles/tickets
-- Rode este arquivo no Supabase Dashboard > SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- categories
DROP POLICY IF EXISTS "Admins can manage categories" ON ticket_categories;
CREATE POLICY "Admins can manage categories" ON ticket_categories FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Analysts and admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Analysts and admins can update tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update own open tickets" ON tickets;

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

-- comments
DROP POLICY IF EXISTS "Users can view comments on accessible tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Users can add comments on accessible tickets" ON ticket_comments;

CREATE POLICY "Users can view comments on accessible tickets" ON ticket_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_comments.ticket_id
    AND (t.requester_id = auth.uid()
      OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));
CREATE POLICY "Users can add comments on accessible tickets" ON ticket_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- files
DROP POLICY IF EXISTS "Users can view files on accessible tickets" ON ticket_files;
DROP POLICY IF EXISTS "Users can upload files to accessible tickets" ON ticket_files;

CREATE POLICY "Users can view files on accessible tickets" ON ticket_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_files.ticket_id
    AND (t.requester_id = auth.uid()
      OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));
CREATE POLICY "Users can upload files to accessible tickets" ON ticket_files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- history
DROP POLICY IF EXISTS "Analysts can view ticket history" ON ticket_history;
CREATE POLICY "Analysts can view ticket history" ON ticket_history FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- assets
DROP POLICY IF EXISTS "Users can view all assets" ON assets;
DROP POLICY IF EXISTS "Analysts and admins can manage assets" ON assets;
CREATE POLICY "Users can view all assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage assets" ON assets FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- maintenance
DROP POLICY IF EXISTS "Users can view maintenance" ON maintenance;
DROP POLICY IF EXISTS "Analysts and admins can manage maintenance" ON maintenance;
CREATE POLICY "Users can view maintenance" ON maintenance FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage maintenance" ON maintenance FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- knowledge base
DROP POLICY IF EXISTS "Users can view published articles" ON knowledge_base;
DROP POLICY IF EXISTS "Analysts and admins can manage articles" ON knowledge_base;
CREATE POLICY "Users can view published articles" ON knowledge_base FOR SELECT USING (true);
CREATE POLICY "Analysts and admins can manage articles" ON knowledge_base FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT
  WITH CHECK (true);

-- settings
DROP POLICY IF EXISTS "Users can view settings" ON settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Users can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON settings FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "System can create audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- sla rules
DROP POLICY IF EXISTS "Users can view SLA rules" ON sla_rules;
DROP POLICY IF EXISTS "Admins can manage SLA rules" ON sla_rules;
CREATE POLICY "Users can view SLA rules" ON sla_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage SLA rules" ON sla_rules FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RPC usado pelo dashboard
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

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tickets_by_month(INT) TO anon, authenticated;
