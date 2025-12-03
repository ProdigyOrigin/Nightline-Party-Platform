BEGIN;

-- Remove profile_picture_url from regular users (role = 'user')
UPDATE users 
SET profile_picture_url = NULL 
WHERE role = 'user' AND profile_picture_url IS NOT NULL;

-- Add a constraint to ensure regular users cannot have profile pictures
ALTER TABLE users ADD CONSTRAINT check_user_profile_picture 
CHECK (
  (role = 'user' AND profile_picture_url IS NULL) OR 
  (role IN ('promoter', 'admin', 'owner'))
);

COMMIT;