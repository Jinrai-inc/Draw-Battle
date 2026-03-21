-- Increment wins for a user
CREATE OR REPLACE FUNCTION increment_wins(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_wins = total_wins + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment losses for a user
CREATE OR REPLACE FUNCTION increment_losses(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_losses = total_losses + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update max damage record
CREATE OR REPLACE FUNCTION update_max_damage(p_user_id UUID, p_damage INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET max_damage = GREATEST(max_damage, p_damage)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
