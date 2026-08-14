-- ============================================
-- Migration: Public Ticket Tracking
-- Adiciona campos de token público e funções RPC
-- para acompanhamento seguro sem login
-- ============================================

-- 1) Adicionar colunas de tracking público na tabela tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS public_tracking_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS public_tracking_created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS public_tracking_last_access TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS public_tracking_expires_at TIMESTAMPTZ;

-- 2) Índice para busca rápida por token público
CREATE INDEX IF NOT EXISTS idx_tickets_public_token ON tickets(public_token);

-- 3) Função para gerar token público aleatório seguro
CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_token TEXT;
  v_attempts INT := 0;
BEGIN
  LOOP
    v_token := upper(
      substr(md5(random()::text || clock_timestamp()::text || random()::text), 1, 12)
    );
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      v_token := upper(substr(md5(gen_random_uuid()::text), 1, 12));
    END IF;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM tickets WHERE public_token = v_token);
  END LOOP;
  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_public_token() TO anon, authenticated;

-- 4) Função RPC segura para buscar ticket por token público
-- Retorna apenas dados permitidos para visualização pública
CREATE OR REPLACE FUNCTION public.get_ticket_by_public_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  ticket_number INT,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  scheduled_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  location TEXT,
  category_name TEXT,
  department_name TEXT,
  requester_name TEXT,
  public_tracking_enabled BOOLEAN,
  public_tracking_last_access TIMESTAMPTZ,
  public_tracking_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Atualizar último acesso
  UPDATE tickets
  SET public_tracking_last_access = NOW()
  WHERE public_token = p_token
    AND public_tracking_enabled = TRUE
    AND (public_tracking_expires_at IS NULL OR public_tracking_expires_at > NOW());

  RETURN QUERY
  SELECT
    t.id,
    t.ticket_number,
    t.title,
    t.description,
    t.status::TEXT,
    t.priority::TEXT,
    t.scheduled_date,
    t.created_at,
    t.updated_at,
    t.resolved_at,
    t.location,
    COALESCE(c.name, 'Sem categoria')::TEXT,
    COALESCE(d.name, 'Sem setor')::TEXT,
    COALESCE(t.requester_name, 'Anônimo')::TEXT,
    t.public_tracking_enabled,
    t.public_tracking_last_access,
    t.public_tracking_expires_at
  FROM tickets t
  LEFT JOIN ticket_categories c ON c.id = t.category_id
  LEFT JOIN departments d ON d.id = t.department_id
  WHERE t.public_token = p_token
    AND t.public_tracking_enabled = TRUE
    AND (t.public_tracking_expires_at IS NULL OR t.public_tracking_expires_at > NOW())
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ticket_by_public_token(TEXT) TO anon, authenticated;

-- 5) Função RPC para revogar token público (admin only)
CREATE OR REPLACE FUNCTION public.revoke_public_token(p_ticket_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tickets
  SET public_tracking_enabled = FALSE
  WHERE id = p_ticket_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_public_token(UUID) TO authenticated;

-- 6) Função RPC para regenerar token público (admin only)
CREATE OR REPLACE FUNCTION public.regenerate_public_token(p_ticket_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_token TEXT;
BEGIN
  v_new_token := public.generate_public_token();
  UPDATE tickets
  SET public_token = v_new_token,
      public_tracking_created_at = NOW(),
      public_tracking_enabled = TRUE,
      public_tracking_last_access = NULL,
      public_tracking_expires_at = NULL
  WHERE id = p_ticket_id;
  RETURN v_new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.regenerate_public_token(UUID) TO authenticated;

-- 7) Função RPC para atualizar create_public_ticket com geração de token
DROP FUNCTION IF EXISTS create_public_ticket;
CREATE OR REPLACE FUNCTION create_public_ticket(
  p_title TEXT,
  p_description TEXT,
  p_requester_name TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_requester_phone TEXT DEFAULT NULL,
  p_requester_email TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_lgpd_consent BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id UUID;
  v_ticket_number INT;
  v_public_token TEXT;
  v_result JSON;
  v_analyst_id UUID;
BEGIN
  IF NOT p_lgpd_consent THEN
    RAISE EXCEPTION 'Consentimento LGPD obrigatorio';
  END IF;

  v_public_token := public.generate_public_token();
  SELECT public.get_profile_id_by_email('wellington.s@galvanizacaoraitz.com.br') INTO v_analyst_id;

  INSERT INTO tickets (
    title, description, priority, requester_name, requester_phone,
    requester_email, department, status, scheduled_date, public_token, assigned_to
  ) VALUES (
    p_title, p_description, p_priority::ticket_priority,
    p_requester_name, p_requester_phone, p_requester_email,
    p_department, 'open', CURRENT_DATE, v_public_token, v_analyst_id
  )
  RETURNING id, ticket_number INTO v_ticket_id, v_ticket_number;

  SELECT json_build_object(
    'id', v_ticket_id,
    'ticket_number', v_ticket_number,
    'public_token', v_public_token
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION create_public_ticket TO anon;

-- 8) Habilitar Realtime para tickets (se o realtime estiver habilitado)
-- ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
