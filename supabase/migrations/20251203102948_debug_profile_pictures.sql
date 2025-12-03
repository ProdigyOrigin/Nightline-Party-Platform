BEGIN;

-- Check current profile picture URLs for non-user roles
DO $$
DECLARE
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== PROFILE PICTURE DEBUG ===';
    FOR user_record IN SELECT id, username, role, profile_picture_url FROM users WHERE role IN ('owner', 'admin', 'promoter') LOOP
        RAISE NOTICE 'User: %, Role: %, Profile URL: %', user_record.username, user_record.role, user_record.profile_picture_url;
    END LOOP;
    RAISE NOTICE '=== END DEBUG ===';
END $$;

-- Update any remaining /default.jpg URLs to NULL for non-user roles (since they should have actual uploaded pictures)
UPDATE users 
SET profile_picture_url = NULL 
WHERE role IN ('owner', 'admin', 'promoter') 
AND profile_picture_url = '/default.jpg';

COMMIT;