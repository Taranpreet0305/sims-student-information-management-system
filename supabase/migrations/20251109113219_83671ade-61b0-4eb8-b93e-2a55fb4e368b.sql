-- Add new administrative roles to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'placement_coordinator';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hod';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vice_principal';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'director';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'chairman';

-- Add position field to faculty_profiles for administrative roles
ALTER TABLE faculty_profiles ADD COLUMN IF NOT EXISTS position text;

-- Create a table for tracking performance reports
CREATE TABLE IF NOT EXISTS performance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  enrollment_number text NOT NULL,
  generated_by uuid REFERENCES faculty_profiles(id),
  report_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  term text NOT NULL
);

ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;

-- Faculty can view and create performance reports
CREATE POLICY "Faculty can manage performance reports"
ON performance_reports
FOR ALL
USING (EXISTS (
  SELECT 1 FROM faculty_profiles WHERE faculty_profiles.id = auth.uid()
));

-- Create a table for real-time notifications
CREATE TABLE IF NOT EXISTS faculty_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE faculty_notifications ENABLE ROW LEVEL SECURITY;

-- Faculty can view their own notifications
CREATE POLICY "Faculty can view own notifications"
ON faculty_notifications
FOR SELECT
USING (auth.uid() = faculty_id);

-- Faculty can update their own notifications (mark as read)
CREATE POLICY "Faculty can update own notifications"
ON faculty_notifications
FOR UPDATE
USING (auth.uid() = faculty_id);

-- System can create notifications for faculty
CREATE POLICY "System can create notifications"
ON faculty_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for faculty_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE faculty_notifications;

-- Create function to check if user has elevated admin role
CREATE OR REPLACE FUNCTION public.has_elevated_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'hod', 'vice_principal', 'director', 'chairman')
  )
$$;

-- Update faculty_profiles RLS to allow elevated roles to view all profiles
DROP POLICY IF EXISTS "Faculty can view their own profile" ON faculty_profiles;

CREATE POLICY "Faculty can view their own profile"
ON faculty_profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_elevated_role(auth.uid())
);

-- Allow elevated roles to update faculty profiles
CREATE POLICY "Elevated roles can update faculty profiles"
ON faculty_profiles
FOR UPDATE
USING (has_elevated_role(auth.uid()));

-- Update profiles RLS to allow elevated roles and class coordinators to edit student info
DROP POLICY IF EXISTS "Faculty can view assigned students" ON profiles;

CREATE POLICY "Faculty can view assigned students"
ON profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_elevated_role(auth.uid())
  OR (EXISTS (
    SELECT 1
    FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
    AND faculty_profiles.assigned_course = profiles.course_name
    AND faculty_profiles.assigned_year = profiles.year
    AND faculty_profiles.assigned_section = profiles.section
  ))
);

CREATE POLICY "Elevated roles can update student profiles"
ON profiles
FOR UPDATE
USING (
  has_elevated_role(auth.uid())
  OR (EXISTS (
    SELECT 1
    FROM faculty_profiles
    WHERE faculty_profiles.id = auth.uid()
    AND faculty_profiles.assigned_course = profiles.course_name
    AND faculty_profiles.assigned_year = profiles.year
    AND faculty_profiles.assigned_section = profiles.section
  ))
);

-- Allow elevated roles to manage user roles
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

CREATE POLICY "Elevated roles can manage roles"
ON user_roles
FOR ALL
USING (has_elevated_role(auth.uid()));

-- Create function to notify faculty on new registrations
CREATE OR REPLACE FUNCTION notify_faculty_on_student_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify admins and class coordinators
  INSERT INTO faculty_notifications (faculty_id, title, message, type, metadata)
  SELECT 
    fp.id,
    'New Student Registration',
    'New student ' || NEW.name || ' has registered for ' || NEW.course_name || ' Year ' || NEW.year || ' Section ' || NEW.section,
    'student_registration',
    jsonb_build_object('student_id', NEW.id, 'enrollment_number', NEW.enrollment_number)
  FROM faculty_profiles fp
  LEFT JOIN user_roles ur ON ur.user_id = fp.id
  WHERE 
    ur.role IN ('admin', 'hod', 'vice_principal', 'director', 'chairman')
    OR (
      fp.assigned_course = NEW.course_name 
      AND fp.assigned_year = NEW.year 
      AND fp.assigned_section = NEW.section
    );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_student_registration
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_faculty_on_student_registration();

-- Create function to notify faculty on new feedback
CREATE OR REPLACE FUNCTION notify_faculty_on_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify all faculty members
  INSERT INTO faculty_notifications (faculty_id, title, message, type, metadata)
  SELECT 
    fp.id,
    'New Feedback Submitted',
    'New feedback received in category: ' || NEW.category,
    'feedback',
    jsonb_build_object('feedback_id', NEW.id, 'category', NEW.category, 'rating', NEW.rating)
  FROM faculty_profiles fp;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_feedback_submission
AFTER INSERT ON feedback
FOR EACH ROW
EXECUTE FUNCTION notify_faculty_on_feedback();