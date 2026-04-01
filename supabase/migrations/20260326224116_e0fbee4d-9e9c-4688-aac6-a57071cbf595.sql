-- Table for instructor → freelancer technical assistant invitations
CREATE TABLE public.assistant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  course_id uuid REFERENCES public.training_courses(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'technical_assistant',
  support_scope text,
  duration text,
  compensation_type text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.assistant_invitations ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own invitations
CREATE POLICY "Instructors manage own invitations"
  ON public.assistant_invitations FOR ALL TO authenticated
  USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

-- Freelancers can view invitations sent to them
CREATE POLICY "Freelancers view received invitations"
  ON public.assistant_invitations FOR SELECT TO authenticated
  USING (auth.uid() = freelancer_id);

-- Freelancers can update (accept/decline) invitations sent to them
CREATE POLICY "Freelancers respond to invitations"
  ON public.assistant_invitations FOR UPDATE TO authenticated
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

-- Admins full access
CREATE POLICY "Admins manage all invitations"
  ON public.assistant_invitations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_assistant_invitations_updated_at
  BEFORE UPDATE ON public.assistant_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();