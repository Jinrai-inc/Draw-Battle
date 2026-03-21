CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id),
  addressee_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own friend requests"
  ON friends FOR SELECT
  USING (
    requester_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR addressee_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can send friend requests"
  ON friends FOR INSERT
  WITH CHECK (requester_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update received requests"
  ON friends FOR UPDATE
  USING (addressee_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
