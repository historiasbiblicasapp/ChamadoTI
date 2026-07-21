-- Add requester_name for anonymous tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requester_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requester_email TEXT;

-- Allow anonymous ticket creation via RPC
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
  v_result JSON;
BEGIN
  IF NOT p_lgpd_consent THEN
    RAISE EXCEPTION 'Consentimento LGPD obrigatorio';
  END IF;

  INSERT INTO tickets (title, description, priority, requester_name, requester_phone, requester_email, department, status, scheduled_date)
  VALUES (p_title, p_description, p_priority::ticket_priority, p_requester_name, p_requester_phone, p_requester_email, p_department, 'open', CURRENT_DATE)
  RETURNING id, ticket_number INTO v_ticket_id, v_ticket_number;

  SELECT json_build_object(
    'id', v_ticket_id,
    'ticket_number', v_ticket_number
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Allow anonymous execution of the function
GRANT EXECUTE ON FUNCTION create_public_ticket TO anon;
