CREATE UNIQUE INDEX IF NOT EXISTS uq_assistant_invitation_live
  ON public.assistant_invitations (instructor_id, freelancer_id, course_id)
  WHERE status IN ('pending', 'accepted');