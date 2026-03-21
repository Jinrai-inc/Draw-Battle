CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage queue"
  ON matchmaking_queue FOR ALL
  USING (true);

CREATE INDEX idx_matchmaking_rating ON matchmaking_queue(rating);
CREATE INDEX idx_matchmaking_created_at ON matchmaking_queue(created_at);
