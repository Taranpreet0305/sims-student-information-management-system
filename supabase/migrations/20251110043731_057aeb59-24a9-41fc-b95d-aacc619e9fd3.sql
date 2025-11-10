-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-photos', 'candidate-photos', true);

-- RLS policies for candidate photos
CREATE POLICY "Anyone can view candidate photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-photos');

CREATE POLICY "Faculty can upload candidate photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-photos' AND
  EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);

CREATE POLICY "Faculty can update candidate photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-photos' AND
  EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);

CREATE POLICY "Faculty can delete candidate photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-photos' AND
  EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);