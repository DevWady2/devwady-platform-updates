
CREATE OR REPLACE FUNCTION public.get_course_structure_counts(p_course_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'milestones', (SELECT count(*) FROM course_milestones WHERE course_id = p_course_id AND is_published = true),
    'assessments', (SELECT count(*) FROM course_assessments WHERE course_id = p_course_id AND is_published = true),
    'projects', (SELECT count(*) FROM course_projects WHERE course_id = p_course_id AND is_published = true),
    'sessions', (SELECT count(*) FROM course_sessions WHERE course_id = p_course_id AND is_published = true),
    'cohorts', (SELECT count(*) FROM course_cohorts WHERE course_id = p_course_id AND status IN ('active', 'draft'))
  );
$$;
