CREATE TABLE titles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL
);

CREATE TABLE user_titles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title_id TEXT REFERENCES titles(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, title_id)
);

ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own titles"
  ON user_titles FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Seed default titles
INSERT INTO titles (id, name, description, condition_type, condition_value) VALUES
  ('first_win', '初陣', '初めてバトルに勝利', 'wins', 1),
  ('collector_10', 'コレクター', 'キャラを10体保存', 'characters', 10),
  ('fire_master', '属性マスター：炎', '炎属性キャラを10体作成', 'element_fire', 10),
  ('water_master', '属性マスター：水', '水属性キャラを10体作成', 'element_water', 10),
  ('wind_master', '属性マスター：風', '風属性キャラを10体作成', 'element_wind', 10),
  ('thunder_master', '属性マスター：雷', '雷属性キャラを10体作成', 'element_thunder', 10),
  ('dark_master', '属性マスター：闇', '闇属性キャラを10体作成', 'element_dark', 10),
  ('veteran_100', '百戦錬磨', '100勝達成', 'wins', 100),
  ('ssr_hunter', 'SSRハンター', 'SSRキャラを初めて入手', 'rarity_ssr', 1),
  ('codex_50', '図鑑マニア', '図鑑コンプ率50%達成', 'codex_completion', 50),
  ('naming_sss', 'ネーミングセンス', '必殺技威力ランクSSSを出す', 'special_rank_sss', 1),
  ('win_streak_10', '連勝王', '10連勝達成', 'win_streak', 10),
  ('legend', '伝説', '図鑑コンプ率100%達成', 'codex_completion', 100),
  ('alchemist', '錬金術師', '初めて合成成功', 'synthesis', 1);
