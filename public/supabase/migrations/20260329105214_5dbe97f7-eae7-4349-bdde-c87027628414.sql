
-- ============================================================
-- Finding 3 Follow-up: Profile Cross-User Read RPCs
-- ============================================================

-- RPC 1: Public browse (hiring, talent pool, invite candidates)
CREATE OR REPLACE FUNCTION public.get_public_profiles_browse(p_search text DEFAULT NULL)
RETURNS TABLE (
  id uuid, user_id uuid, full_name text, avatar_url text, bio text,
  location text, skills text[], track text, batch text, rating numeric,
  projects_count int, is_available boolean, slug text, is_devwady_alumni boolean,
  hourly_rate text, portfolio_url text, linkedin_url text, github_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT p.id, p.user_id, p.full_name, p.avatar_url, p.bio,
         p.location, p.skills, p.track, p.batch, p.rating,
         p.projects_count, p.is_available, p.slug, p.is_devwady_alumni,
         p.hourly_rate, p.portfolio_url, p.linkedin_url, p.github_url
  FROM profiles p
  WHERE p.account_status = 'active'
    AND p.full_name IS NOT NULL
    AND (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%')
  ORDER BY p.rating DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles_browse(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles_browse(text) TO anon, authenticated;

-- RPC 2: Single profile display (instructor card on course page)
CREATE OR REPLACE FUNCTION public.get_profile_display_by_id(p_user_id uuid)
RETURNS TABLE (
  user_id uuid, full_name text, avatar_url text, bio text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url, p.bio
  FROM profiles p
  WHERE p.user_id = p_user_id AND p.account_status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_profile_display_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_display_by_id(uuid) TO anon, authenticated;

-- RPC 3: Course student profiles (instructor-scoped)
CREATE OR REPLACE FUNCTION public.get_course_student_profiles(p_course_ids uuid[])
RETURNS TABLE (
  user_id uuid, full_name text, avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT DISTINCT p.user_id, p.full_name, p.avatar_url
  FROM profiles p
  JOIN course_enrollments ce ON ce.user_id = p.user_id
  JOIN training_courses tc ON tc.id = ce.course_id
  WHERE ce.course_id = ANY(p_course_ids)
    AND tc.instructor_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_course_student_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_student_profiles(uuid[]) TO authenticated;

-- RPC 4: Instructor assistant profiles (relationship-scoped, optional course filter)
CREATE OR REPLACE FUNCTION public.get_instructor_assistant_profiles(p_course_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid, user_id uuid, full_name text, avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT DISTINCT p.id, p.user_id, p.full_name, p.avatar_url
  FROM profiles p
  JOIN assistant_invitations ai ON ai.freelancer_id = p.user_id
  WHERE ai.instructor_id = auth.uid()
    AND (p_course_id IS NULL OR ai.course_id = p_course_id);
$$;

REVOKE ALL ON FUNCTION public.get_instructor_assistant_profiles(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_instructor_assistant_profiles(uuid) TO authenticated;

-- RPC 5: Question author profiles (instructor-scoped)
CREATE OR REPLACE FUNCTION public.get_question_author_profiles(p_course_ids uuid[])
RETURNS TABLE (
  user_id uuid, full_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT DISTINCT p.user_id, p.full_name
  FROM profiles p
  JOIN course_questions cq ON cq.asked_by = p.user_id
  JOIN training_courses tc ON tc.id = cq.course_id
  WHERE cq.course_id = ANY(p_course_ids)
    AND tc.instructor_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_question_author_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_question_author_profiles(uuid[]) TO authenticated;
