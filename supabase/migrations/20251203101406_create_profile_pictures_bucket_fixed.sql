BEGIN;

-- Create the profile-pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures', 
  'profile-pictures', 
  true, 
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create a policy to allow service role to bypass RLS for profile pictures
CREATE POLICY "Service role can manage profile pictures" ON storage.objects
FOR ALL USING (
  bucket_id = 'profile-pictures' AND 
  auth.role() = 'service_role'
);

-- Create a policy to allow public access to read profile pictures
CREATE POLICY "Profile pictures are publicly accessible" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-pictures'
);

COMMIT;