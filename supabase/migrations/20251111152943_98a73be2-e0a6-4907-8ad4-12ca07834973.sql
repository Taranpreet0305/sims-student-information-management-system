-- Add result_published field to elections table
ALTER TABLE public.elections 
ADD COLUMN IF NOT EXISTS result_published boolean DEFAULT false;

-- Add PDF support for notifications/notices
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS attachment_url text;

-- Create storage bucket for notice PDFs if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('notice-pdfs', 'notice-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for notice PDFs
CREATE POLICY "Faculty can upload notice PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notice-pdfs' AND
  EXISTS (SELECT 1 FROM faculty_profiles WHERE id = auth.uid())
);

CREATE POLICY "Faculty can view notice PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'notice-pdfs' AND
  EXISTS (SELECT 1 FROM faculty_profiles WHERE id = auth.uid())
);

CREATE POLICY "Students can view notice PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'notice-pdfs' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Faculty can delete notice PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'notice-pdfs' AND
  EXISTS (SELECT 1 FROM faculty_profiles WHERE id = auth.uid())
);