-- Drop the global settings table
DROP TABLE IF EXISTS system_settings;

-- Create the new user-scoped settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);
