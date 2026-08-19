-- ============================================
-- FIX: Production ticket_history INSERT policy missing
-- Execute no Supabase SQL Editor
-- ============================================

-- Add missing INSERT policy for ticket_history triggers
CREATE POLICY "System can create ticket history" ON ticket_history FOR INSERT
  WITH CHECK (true);

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
