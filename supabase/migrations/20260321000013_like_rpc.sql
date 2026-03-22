-- Increment like count on character
CREATE OR REPLACE FUNCTION increment_like_count(p_character_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE characters
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = p_character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement like count on character
CREATE OR REPLACE FUNCTION decrement_like_count(p_character_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE characters
  SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
  WHERE id = p_character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
