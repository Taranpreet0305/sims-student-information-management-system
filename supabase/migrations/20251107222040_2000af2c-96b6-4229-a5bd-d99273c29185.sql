-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'director', 'chairman', 'vice_principal', 'hod', 'class_coordinator', 'associate_professor', 'assistant_professor');
CREATE TYPE public.election_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.candidate_position AS ENUM ('president', 'vice_president', 'secretary', 'class_representative');

-- Student profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_number TEXT UNIQUE NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  course_name TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
  section TEXT NOT NULL,
  phone TEXT,
  verify BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty profiles table
CREATE TABLE public.faculty_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  faculty_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  assigned_course TEXT,
  assigned_year INTEGER CHECK (assigned_year BETWEEN 1 AND 4),
  assigned_section TEXT,
  phone TEXT,
  verify BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  enrollment_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  total_classes INTEGER NOT NULL DEFAULT 0,
  classes_attended INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student marks table
CREATE TABLE public.student_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_number TEXT NOT NULL,
  student_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  term TEXT NOT NULL,
  internal_marks DECIMAL(5,2),
  external_marks DECIMAL(5,2),
  total_marks DECIMAL(5,2),
  credits INTEGER,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Elections table
CREATE TABLE public.elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status election_status DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  enrollment_number TEXT NOT NULL,
  name TEXT NOT NULL,
  position candidate_position NOT NULL,
  course_name TEXT,
  year INTEGER,
  section TEXT,
  manifesto TEXT,
  photo_url TEXT,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  voter_enrollment TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (election_id, voter_enrollment)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_course TEXT,
  target_year INTEGER,
  target_section TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placements table
CREATE TABLE public.placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT NOT NULL,
  date DATE,
  link TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placement applications table
CREATE TABLE public.placement_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID REFERENCES public.placements(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  enrollment_number TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (placement_id, enrollment_number)
);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  student_enrollment TEXT NOT NULL,
  faculty_id TEXT,
  category TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class representatives table
CREATE TABLE public.class_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  enrollment_number TEXT NOT NULL,
  name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  section TEXT NOT NULL,
  designated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_name, year, section)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_representatives ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Students can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Students can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Faculty can view student profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for faculty_profiles
CREATE POLICY "Faculty can view their own profile" ON public.faculty_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Faculty can update their own profile" ON public.faculty_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Faculty can insert their own profile" ON public.faculty_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (student_id = attendance.student_id OR enrollment_number = attendance.enrollment_number))
  );

CREATE POLICY "Faculty can view and manage attendance" ON public.attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for student_marks
CREATE POLICY "Students can view their own marks" ON public.student_marks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND enrollment_number = student_marks.enrollment_number)
  );

CREATE POLICY "Faculty can view and manage marks" ON public.student_marks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for elections
CREATE POLICY "Everyone can view active elections" ON public.elections
  FOR SELECT USING (status = 'active');

CREATE POLICY "Faculty can manage elections" ON public.elections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for candidates
CREATE POLICY "Everyone can view candidates" ON public.candidates
  FOR SELECT USING (true);

CREATE POLICY "Faculty can manage candidates" ON public.candidates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for votes
CREATE POLICY "Students can insert their own votes" ON public.votes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND enrollment_number = votes.voter_enrollment)
  );

CREATE POLICY "Students can view their own votes" ON public.votes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND enrollment_number = votes.voter_enrollment)
  );

-- RLS Policies for notifications
CREATE POLICY "Students can view targeted notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        target_course IS NULL OR target_course = course_name
      )
      AND (
        target_year IS NULL OR target_year = year
      )
      AND (
        target_section IS NULL OR target_section = section
      )
    )
  );

CREATE POLICY "Faculty can create and view notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for placements
CREATE POLICY "Everyone can view active placements" ON public.placements
  FOR SELECT USING (status = 'active');

CREATE POLICY "Faculty can manage placements" ON public.placements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for placement_applications
CREATE POLICY "Students can view and create their applications" ON public.placement_applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND enrollment_number = placement_applications.enrollment_number)
  );

CREATE POLICY "Faculty can view all applications" ON public.placement_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for feedback
CREATE POLICY "Students can create and view their own feedback" ON public.feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND enrollment_number = feedback.student_enrollment)
  );

CREATE POLICY "Faculty can view feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- RLS Policies for class_representatives
CREATE POLICY "Students can view CRs of their class" ON public.class_representatives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND course_name = class_representatives.course_name
      AND year = class_representatives.year
      AND section = class_representatives.section
    )
  );

CREATE POLICY "Faculty can manage class representatives" ON public.class_representatives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.faculty_profiles WHERE id = auth.uid())
  );

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faculty_profiles_updated_at BEFORE UPDATE ON public.faculty_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_enrollment ON public.attendance(enrollment_number);
CREATE INDEX idx_marks_enrollment ON public.student_marks(enrollment_number);
CREATE INDEX idx_notifications_target ON public.notifications(target_course, target_year, target_section);
CREATE INDEX idx_votes_election ON public.votes(election_id);
CREATE INDEX idx_candidates_election ON public.candidates(election_id);