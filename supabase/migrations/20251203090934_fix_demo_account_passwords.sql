BEGIN;

-- Update password hashes for demo accounts
UPDATE users SET password_hash = '$2b$10$zqTbLOwDQMzI9Ers5IeyMuh/AoAhZyVugLG4/kHYW9X7/uNLJ39ra' WHERE username IN ('owner', 'admin', 'promoter1', 'user1');

COMMIT;