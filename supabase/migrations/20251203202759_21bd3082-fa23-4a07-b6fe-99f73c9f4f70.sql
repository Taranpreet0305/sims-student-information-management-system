-- Fix RLS policy to allow students to view completed elections with published results
DROP POLICY IF EXISTS "Everyone can view active elections" ON public.elections;

CREATE POLICY "Everyone can view elections" 
ON public.elections 
FOR SELECT 
USING (
  status = 'active'::election_status 
  OR (status = 'completed'::election_status AND result_published = true)
);

-- Fix votes RLS to ensure proper voting
DROP POLICY IF EXISTS "Students can insert votes once per election" ON public.votes;

CREATE POLICY "Students can vote once per election" 
ON public.votes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.enrollment_number = votes.voter_enrollment
  )
);

-- Add faculty can view all votes policy for admin purposes
CREATE POLICY "Faculty can view all votes" 
ON public.votes 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM faculty_profiles WHERE faculty_profiles.id = auth.uid())
);

-- Create function to increment vote count
CREATE OR REPLACE FUNCTION public.increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.candidates 
  SET vote_count = COALESCE(vote_count, 0) + 1 
  WHERE id = NEW.candidate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-increment vote count
DROP TRIGGER IF EXISTS on_vote_inserted ON public.votes;
CREATE TRIGGER on_vote_inserted
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.increment_vote_count();