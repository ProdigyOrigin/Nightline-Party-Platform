BEGIN;

-- Insert sample users
INSERT INTO users (username, password_hash, email, role) VALUES 
('admin', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjO', 'admin@nightline.com', 'admin'),
('promoter1', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjO', 'promoter1@nightline.com', 'promoter'),
('user1', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjO', 'user1@nightline.com', 'user');

-- Get user IDs for event creation
DO $$
DECLARE
    owner_id UUID;
    admin_id UUID;
    promoter_id UUID;
    user_id UUID;
BEGIN
    SELECT id INTO owner_id FROM users WHERE username = 'owner';
    SELECT id INTO admin_id FROM users WHERE username = 'admin';
    SELECT id INTO promoter_id FROM users WHERE username = 'promoter1';
    SELECT id INTO user_id FROM users WHERE username = 'user1';

    -- Insert sample events
    INSERT INTO events (name, description, date, start_time, end_time, venue_name, venue_address, city, organizer_user_id, is_published, status, is_featured, featured_rank, submitted_by_promoter_id) VALUES 
    ('Summer Beach Party', 'Join us for the biggest beach party of the summer! Live DJ, drinks, and amazing vibes. Don''t miss out on this epic night.', '2024-07-15', '20:00:00', '02:00:00', 'Santa Monica Beach Club', '2600 Barnard Way, Santa Monica', 'Los Angeles', admin_id, true, 'published', true, 1, promoter_id),
    ('College Night at The Rooftop', 'Exclusive college night with student discounts. Three floors of music, dancing, and fun. Bring your student ID!', '2024-07-20', '21:00:00', '03:00:00', 'Skyline Rooftop Lounge', '6801 Hollywood Blvd, Hollywood', 'Los Angeles', admin_id, true, 'published', true, 2, promoter_id),
    ('Electronic Music Festival', 'Top DJs from around the world. Three stages, laser shows, and an unforgettable experience. Get your tickets now!', '2024-08-01', '18:00:00', '04:00:00', 'Bay Area Event Center', '747 Howard Street, San Francisco', 'San Francisco', admin_id, true, 'published', true, 3, promoter_id),
    ('Pool Party Saturday', 'Daytime pool party with DJ sets, pool games, and drink specials. Perfect for soaking up the California sun.', '2024-07-22', '12:00:00', '20:00:00', 'Hollywood Pool House', '1715 N McCadden Pl, Hollywood', 'Los Angeles', promoter_id, true, 'published', false, null, promoter_id),
    ('Underground Hip Hop Night', 'Intimate venue featuring local hip hop artists. Open mic session and dance battles. All ages welcome.', '2024-07-25', '19:00:00', '23:00:00', 'The Underground', '84 1/2 Virginia Road, West Hollywood', 'Los Angeles', promoter_id, true, 'published', false, null, promoter_id),
    ('Frat Party Extravaganza', 'Annual Greek life party with multiple fraternities hosting. Live band, beer pong tournament, and more.', '2024-07-28', '20:00:00', '02:00:00', 'UCLA Frat Row', '405 Hilgard Ave, Los Angeles', 'Los Angeles', user_id, true, 'published', false, null, null);

    -- Insert a draft event for testing
    INSERT INTO events (name, description, date, start_time, end_time, venue_name, venue_address, city, organizer_user_id, is_published, status, is_featured, featured_rank, submitted_by_promoter_id) VALUES 
    ('Upcoming Festival', 'Details coming soon for this amazing festival event.', '2024-09-15', '15:00:00', '23:00:00', 'Golden Gate Park', '501 Stanyan St, San Francisco', 'San Francisco', promoter_id, false, 'draft', false, null, promoter_id);

    -- Insert a pending review event
    INSERT INTO events (name, description, date, start_time, end_time, venue_name, venue_address, city, organizer_user_id, is_published, status, is_featured, featured_rank, submitted_by_promoter_id) VALUES 
    ('Tech Startup Mixer', 'Networking event for tech professionals and entrepreneurs. Free drinks and appetizers.', '2024-08-10', '18:30:00', '22:00:00', 'Innovation Hub', '500 Howard Street, San Francisco', 'San Francisco', promoter_id, false, 'pending_review', false, null, promoter_id);
END $$;

-- Insert sample support messages
DO $$
DECLARE
    user_id UUID;
    admin_id UUID;
BEGIN
    SELECT id INTO user_id FROM users WHERE username = 'user1';
    SELECT id INTO admin_id FROM users WHERE username = 'admin';

    INSERT INTO support_messages (sender_user_id, subject, message_body, status, handled_by_admin_id) VALUES 
    (user_id, 'Question about ticket prices', 'Hi, I was wondering if there are any student discounts available for the Summer Beach Party? Thanks!', 'open', null),
    (user_id, 'Event promotion inquiry', 'I would like to promote my upcoming event on Nightline. What are the requirements and costs?', 'in_progress', admin_id);
END $$;

COMMIT;