-- Character likes (social reactions)
CREATE TABLE character_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  character_id UUID NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, character_id)
);

ALTER TABLE character_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all likes"
  ON character_likes FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes"
  ON character_likes FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own likes"
  ON character_likes FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Add like_count cache to characters for performance
ALTER TABLE characters ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
