-- Add scheduled_date column to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Create the SECURITY DEFINER function for role checking (fixes infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- Drop and recreate ALL admin-check policies to use the safe function
-- Profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON ticket_categories;
CREATE POLICY "Admins can manage categories" ON ticket_categories FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Tickets
DROP POLICY IF EXISTS "Analysts and admins can view all tickets" ON tickets;
CREATE POLICY "Analysts and admins can view all tickets" ON tickets FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

DROP POLICY IF EXISTS "Analysts and admins can update tickets" ON tickets;
CREATE POLICY "Analysts and admins can update tickets" ON tickets FOR UPDATE
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- Comments
DROP POLICY IF EXISTS "Users can view comments on accessible tickets" ON ticket_comments;
CREATE POLICY "Users can view comments on accessible tickets" ON ticket_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_comments.ticket_id
    AND (t.requester_id = auth.uid()
      OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));

-- Files
DROP POLICY IF EXISTS "Users can view files on accessible tickets" ON ticket_files;
CREATE POLICY "Users can view files on accessible tickets" ON ticket_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_files.ticket_id
    AND (t.requester_id = auth.uid()
      OR public.get_user_role(auth.uid()) IN ('admin', 'analyst'))
  ));

-- History
DROP POLICY IF EXISTS "Analysts can view ticket history" ON ticket_history;
CREATE POLICY "Analysts can view ticket history" ON ticket_history FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- Assets
DROP POLICY IF EXISTS "Analysts and admins can manage assets" ON assets;
CREATE POLICY "Analysts and admins can manage assets" ON assets FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- Maintenance
DROP POLICY IF EXISTS "Analysts and admins can manage maintenance" ON maintenance;
CREATE POLICY "Analysts and admins can manage maintenance" ON maintenance FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- Knowledge base
DROP POLICY IF EXISTS "Analysts and admins can manage articles" ON knowledge_base;
CREATE POLICY "Analysts and admins can manage articles" ON knowledge_base FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'analyst'));

-- Settings
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- SLA rules
DROP POLICY IF EXISTS "Admins can manage SLA rules" ON sla_rules;
CREATE POLICY "Admins can manage SLA rules" ON sla_rules FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create get_tickets_by_month RPC function
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
