-- Create study materials table
CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  course_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  section TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on study materials
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Students can view materials for their course/year/section
CREATE POLICY "Students can view their study materials"
ON public.study_materials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.course_name = study_materials.course_name
    AND profiles.year = study_materials.year
    AND (study_materials.section IS NULL OR profiles.section = study_materials.section)
  )
);

-- Faculty can manage study materials
CREATE POLICY "Faculty can manage study materials"
ON public.study_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);

-- Add placement coordinator role check to placements
DROP POLICY IF EXISTS "Faculty can manage placements" ON public.placements;
CREATE POLICY "Placement coordinators and admins can manage placements"
ON public.placements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'placement_coordinator')
  )
);

-- Update trigger for study materials
CREATE TRIGGER update_study_materials_updated_at
BEFORE UPDATE ON public.study_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add type field to notifications for notices vs general notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'notification';

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for study materials
CREATE POLICY "Students can view study materials files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'study-materials');

CREATE POLICY "Faculty can upload study materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-materials' 
  AND EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);

CREATE POLICY "Faculty can update study materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);

CREATE POLICY "Faculty can delete study materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);