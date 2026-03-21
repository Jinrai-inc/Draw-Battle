-- Add profile columns to users table
ALTER TABLE users ADD COLUMN friend_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;

-- Create index for friend ID lookups
CREATE UNIQUE INDEX idx_users_friend_id ON users(friend_id);
