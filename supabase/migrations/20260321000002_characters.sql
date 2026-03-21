CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  name TEXT,
  special_move_name TEXT NOT NULL,
  hp INTEGER NOT NULL,
  atk INTEGER NOT NULL,
  def INTEGER NOT NULL,
  spd INTEGER NOT NULL,
  special INTEGER NOT NULL,
  total_stats INTEGER NOT NULL,
  element TEXT NOT NULL,
  rarity TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  battle_count INTEGER DEFAULT 0,
  is_evolved BOOLEAN DEFAULT false,
  weapon_id UUID,
  armor_id UUID,
  accessory_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own characters"
  ON characters FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_rarity ON characters(rarity);
