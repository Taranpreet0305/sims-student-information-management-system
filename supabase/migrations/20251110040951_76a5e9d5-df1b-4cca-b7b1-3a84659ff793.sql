-- Create timetable table
CREATE TABLE IF NOT EXISTS public.timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text NOT NULL,
  year integer NOT NULL,
  section text NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject text NOT NULL,
  faculty_name text,
  room_number text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- Students can view their class timetable
CREATE POLICY "Students can view their class timetable"
ON public.timetables
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.course_name = timetables.course_name
    AND profiles.year = timetables.year
    AND profiles.section = timetables.section
  )
);

-- Faculty can view all timetables
CREATE POLICY "Faculty can view all timetables"
ON public.timetables
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
  )
);

-- Class coordinators can manage their class timetable
CREATE POLICY "Class coordinators can manage timetable"
ON public.timetables
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
    AND faculty_profiles.assigned_course = timetables.course_name
    AND faculty_profiles.assigned_year = timetables.year
    AND faculty_profiles.assigned_section = timetables.section
  )
);

-- Admins can manage all timetables
CREATE POLICY "Admins can manage all timetables"
ON public.timetables
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_timetables_updated_at
BEFORE UPDATE ON public.timetables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();