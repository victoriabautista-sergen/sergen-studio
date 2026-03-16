
-- Ensure chart-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('chart-images', 'chart-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload/update chart images
CREATE POLICY "Authenticated users can upload chart images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chart-images');

CREATE POLICY "Authenticated users can update chart images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chart-images');

-- Allow public read access for chart images (used in emails)
CREATE POLICY "Public read access for chart images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chart-images');
