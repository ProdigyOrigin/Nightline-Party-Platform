BEGIN;

-- Add profile_picture_url column to users table
ALTER TABLE users ADD COLUMN profile_picture_url TEXT;

-- Create index for better performance
CREATE INDEX idx_users_profile_picture_url ON users(profile_picture_url);

COMMIT;