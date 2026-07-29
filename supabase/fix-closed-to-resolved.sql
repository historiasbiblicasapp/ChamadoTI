UPDATE tickets
SET status = 'resolved',
    updated_at = NOW()
WHERE status = 'closed';
