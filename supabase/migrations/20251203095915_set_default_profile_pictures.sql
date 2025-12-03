BEGIN;

-- Update existing users to have default profile picture URL
UPDATE users SET profile_picture_url = '/default.jpg' WHERE profile_picture_url IS NULL;

COMMIT;