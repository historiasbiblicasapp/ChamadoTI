-- Fix RLS recursion on profiles and create missing RPC
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all profiles" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE OR REPLACE FUNCTION get_tickets_by_month(months_count INTEGER DEFAULT 12)
RETURNS TABLE(name TEXT, value BIGINT)
LANGUAGE sql
AS $$
  SELECT
    to_char(created_at, 'YYYY-MM') AS name,
    count(*) AS value
  FROM tickets
  WHERE created_at >= now() - (months_count || ' months')::interval
  GROUP BY 1
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION get_tickets_by_month TO anon, authenticated;
