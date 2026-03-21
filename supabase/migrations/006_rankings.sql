CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slot TEXT NOT NULL,
  rarity TEXT NOT NULL,
  bonus_stat TEXT NOT NULL,
  bonus_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own equipment"
  ON equipment FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own equipment"
  ON equipment FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Weekly rankings view
CREATE VIEW weekly_rankings AS
SELECT
  u.id,
  u.display_name,
  u.rating,
  COUNT(CASE WHEN b.winner_id = u.id THEN 1 END) AS weekly_wins,
  u.max_damage,
  (SELECT COUNT(*) FROM characters c WHERE c.user_id = u.id) AS collection_count
FROM users u
LEFT JOIN battles b ON (b.player1_id = u.id OR b.player2_id = u.id)
  AND b.created_at >= date_trunc('week', now())
GROUP BY u.id;
