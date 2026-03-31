
-- 1. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  body_en TEXT,
  body_ar TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 2. RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Helper function
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _type TEXT,
  _title_en TEXT,
  _title_ar TEXT DEFAULT NULL,
  _body_en TEXT DEFAULT NULL,
  _body_ar TEXT DEFAULT NULL,
  _link TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title_en, title_ar, body_en, body_ar, link, metadata)
  VALUES (_user_id, _type, _title_en, _title_ar, _body_en, _body_ar, _link, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- 4. Notify admin on new contact
CREATE OR REPLACE FUNCTION public.notify_admin_new_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_record.user_id,
      'contact_new',
      'New message from ' || NEW.name,
      'رسالة جديدة من ' || NEW.name,
      COALESCE(NEW.subject, LEFT(NEW.message, 80)),
      NULL,
      '/admin/contacts',
      jsonb_build_object('contact_id', NEW.id, 'email', NEW.email)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_contact_submission
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_contact();

-- 5. Notify admin on new booking
CREATE OR REPLACE FUNCTION public.notify_admin_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  expert_name TEXT;
BEGIN
  SELECT name INTO expert_name FROM public.consulting_experts WHERE id = NEW.expert_id;
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_record.user_id,
      'booking_new',
      'New booking with ' || COALESCE(expert_name, 'expert'),
      'حجز جديد مع ' || COALESCE(expert_name, 'خبير'),
      COALESCE(NEW.guest_name, 'A user') || ' booked for ' || NEW.booking_date,
      NULL,
      '/admin/bookings',
      jsonb_build_object('booking_id', NEW.id, 'expert_id', NEW.expert_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_booking
  AFTER INSERT ON public.consulting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_booking();

-- 6. Notify applicant on status change
CREATE OR REPLACE FUNCTION public.notify_applicant_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_title TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'pending' THEN
    SELECT title INTO job_title FROM public.job_postings WHERE id = NEW.job_id;
    PERFORM public.create_notification(
      NEW.applicant_user_id,
      'application_status',
      'Application update: ' || COALESCE(job_title, 'a position'),
      'تحديث طلبك: ' || COALESCE(job_title, 'وظيفة'),
      'Your application status changed to ' || NEW.status,
      'حالة طلبك تغيرت إلى ' || NEW.status,
      '/profile/applications',
      jsonb_build_object('job_id', NEW.job_id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_applicant_status_change();

-- 7. Notify freelancer when shortlisted
CREATE OR REPLACE FUNCTION public.notify_freelancer_shortlisted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_name_val TEXT;
BEGIN
  SELECT cp.company_name INTO company_name_val
  FROM public.company_profiles cp
  WHERE cp.user_id = NEW.company_user_id;

  PERFORM public.create_notification(
    NEW.freelancer_user_id,
    'shortlisted',
    'You were shortlisted by ' || COALESCE(company_name_val, 'a company'),
    'تم ترشيحك من قبل ' || COALESCE(company_name_val, 'شركة'),
    'A company is interested in your profile',
    'شركة مهتمة بملفك الشخصي',
    '/profile',
    jsonb_build_object('company_user_id', NEW.company_user_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_freelancer_shortlisted
  AFTER INSERT ON public.freelancer_shortlists
  FOR EACH ROW EXECUTE FUNCTION public.notify_freelancer_shortlisted();

-- 8. Notify company on new job application
CREATE OR REPLACE FUNCTION public.notify_company_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job RECORD;
  applicant_name TEXT;
BEGIN
  SELECT jp.title, jp.company_user_id INTO job FROM public.job_postings jp WHERE jp.id = NEW.job_id;
  SELECT p.full_name INTO applicant_name FROM public.profiles p WHERE p.user_id = NEW.applicant_user_id;

  PERFORM public.create_notification(
    job.company_user_id,
    'job_application',
    COALESCE(applicant_name, 'Someone') || ' applied to ' || COALESCE(job.title, 'your job'),
    COALESCE(applicant_name, 'شخص') || ' تقدم لـ ' || COALESCE(job.title, 'وظيفتك'),
    NULL, NULL,
    '/company/jobs/' || NEW.job_id || '/applicants',
    jsonb_build_object('job_id', NEW.job_id, 'applicant_user_id', NEW.applicant_user_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_job_application
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_company_new_application();

-- 9. Notify freelancer on hire request
CREATE OR REPLACE FUNCTION public.notify_freelancer_hire_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_name_val TEXT;
  freelancer_uid UUID;
BEGIN
  SELECT cp.company_name INTO company_name_val FROM public.company_profiles cp WHERE cp.user_id = NEW.company_id;
  SELECT p.user_id INTO freelancer_uid FROM public.profiles p WHERE p.id = NEW.freelancer_profile_id;

  IF freelancer_uid IS NOT NULL THEN
    PERFORM public.create_notification(
      freelancer_uid,
      'hire_request',
      'Hire offer from ' || COALESCE(company_name_val, 'a company'),
      'عرض توظيف من ' || COALESCE(company_name_val, 'شركة'),
      'A company wants to hire you',
      'شركة ترغب في توظيفك',
      '/profile',
      jsonb_build_object('hire_request_id', NEW.id, 'company_id', NEW.company_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_hire_request
  AFTER INSERT ON public.hire_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_freelancer_hire_request();

-- 10. Update handle_new_user to send welcome notification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');

  PERFORM public.create_notification(
    NEW.id,
    'welcome',
    'Welcome to DevWady!',
    'مرحباً بك في DevWady!',
    'Complete your profile to get started',
    'أكمل ملفك الشخصي للبدء',
    '/profile/edit?onboarding=true',
    '{}'::jsonb
  );

  RETURN NEW;
END;
$$;
