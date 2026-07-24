-- Fix: infinite recursion in profiles RLS policy
-- Run this in Supabase SQL Editor on the new project

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all profiles" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
