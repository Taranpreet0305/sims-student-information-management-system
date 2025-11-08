-- Fix 1: Add unique constraint on votes to prevent duplicate voting
ALTER TABLE public.votes ADD CONSTRAINT unique_vote_per_user_election UNIQUE (election_id, voter_enrollment);

-- Fix 2: Restrict candidates table to authenticated users only
DROP POLICY IF EXISTS "Everyone can view candidates" ON public.candidates;
CREATE POLICY "Authenticated users can view candidates"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 3: Update profiles RLS to restrict faculty viewing students to their assigned class
DROP POLICY IF EXISTS "Faculty can view student profiles" ON public.profiles;
CREATE POLICY "Faculty can view assigned students"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM faculty_profiles
      WHERE faculty_profiles.id = auth.uid()
      AND (
        faculty_profiles.assigned_course = profiles.course_name
        AND faculty_profiles.assigned_year = profiles.year
        AND faculty_profiles.assigned_section = profiles.section
      )
    )
  );

-- Fix 4: Update attendance RLS to use auth.uid() instead of trusting client data
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
CREATE POLICY "Students can view their own attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.student_id = attendance.student_id
        OR profiles.enrollment_number = attendance.enrollment_number
      )
    )
  );

-- Fix 5: Update student_marks RLS to use auth.uid()
DROP POLICY IF EXISTS "Students can view their own marks" ON public.student_marks;
CREATE POLICY "Students can view their own marks"
  ON public.student_marks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.enrollment_number = student_marks.enrollment_number
    )
  );

-- Fix 6: Update votes RLS to use auth.uid() and prevent duplicate votes
DROP POLICY IF EXISTS "Students can insert their own votes" ON public.votes;
CREATE POLICY "Students can insert votes once per election"
  ON public.votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.enrollment_number = voter_enrollment
    )
    AND NOT EXISTS (
      SELECT 1 FROM votes v
      WHERE v.election_id = votes.election_id
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.enrollment_number = v.voter_enrollment
      )
    )
  );

-- Fix 7: Update votes SELECT policy to use auth.uid()
DROP POLICY IF EXISTS "Students can view their own votes" ON public.votes;
CREATE POLICY "Students can view their own votes"
  ON public.votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.enrollment_number = votes.voter_enrollment
    )
  );

-- Fix 8: Update feedback RLS to use auth.uid()
DROP POLICY IF EXISTS "Students can create and view their own feedback" ON public.feedback;
CREATE POLICY "Students can insert feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.enrollment_number = student_enrollment
    )
  );

CREATE POLICY "Students can view their own feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.enrollment_number = feedback.student_enrollment
    )
  );

-- Fix 9: Update placement_applications RLS
DROP POLICY IF EXISTS "Students can view and create their applications" ON public.placement_applications;
CREATE POLICY "Students can insert applications"
  ON public.placement_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.enrollment_number = placement_applications.enrollment_number
    )
  );

CREATE POLICY "Students can view their applications"
  ON public.placement_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.enrollment_number = placement_applications.enrollment_number
    )
  );

-- Fix 10: Add helper function to get current user's enrollment number
CREATE OR REPLACE FUNCTION public.get_current_user_enrollment()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enrollment_number
  FROM profiles
  WHERE id = auth.uid()
$$;

-- Fix 11: Add helper function to get current user's student_id
CREATE OR REPLACE FUNCTION public.get_current_user_student_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id
  FROM profiles
  WHERE id = auth.uid()
$$;