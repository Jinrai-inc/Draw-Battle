CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player1_char_id UUID REFERENCES characters(id),
  player2_char_id UUID REFERENCES characters(id),
  winner_id UUID REFERENCES users(id),
  battle_log JSONB NOT NULL,
  battle_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own battles"
  ON battles FOR SELECT
  USING (
    player1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR player2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Server can insert battles"
  ON battles FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_battles_player1 ON battles(player1_id);
CREATE INDEX idx_battles_player2 ON battles(player2_id);
CREATE INDEX idx_battles_created_at ON battles(created_at);
