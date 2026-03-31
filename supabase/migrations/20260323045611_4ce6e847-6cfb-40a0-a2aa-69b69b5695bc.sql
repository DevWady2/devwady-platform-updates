
-- 1. service_requests table
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_name TEXT,
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  budget_range TEXT,
  timeline TEXT,
  preferred_start_date DATE,
  attachments TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  internal_estimate_usd NUMERIC(10,2),
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_user ON public.service_requests(user_id);
CREATE INDEX idx_service_requests_email ON public.service_requests(contact_email);

-- 2. quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  quote_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal_usd NUMERIC(10,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  tax_pct NUMERIC(5,2) DEFAULT 0,
  total_usd NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  valid_until DATE,
  payment_terms TEXT,
  estimated_duration TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. project_tracking table
CREATE TABLE public.project_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  progress_pct INTEGER DEFAULT 0,
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  total_budget_usd NUMERIC(10,2),
  paid_usd NUMERIC(10,2) DEFAULT 0,
  project_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_member_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. project_updates table
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project_tracking(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'update',
  title TEXT NOT NULL,
  body TEXT,
  attachments TEXT[] DEFAULT '{}',
  is_visible_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- service_requests
CREATE POLICY "Anyone can submit" ON public.service_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users view own" ON public.service_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all" ON public.service_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- quotes
CREATE POLICY "Users view own quotes" ON public.quotes FOR SELECT TO authenticated
  USING (service_request_id IN (SELECT id FROM public.service_requests WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- project_tracking
CREATE POLICY "Users view own projects" ON public.project_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage projects" ON public.project_tracking FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- project_updates
CREATE POLICY "Users view visible updates" ON public.project_updates FOR SELECT TO authenticated
  USING (is_visible_to_client = true AND project_id IN (SELECT id FROM public.project_tracking WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage updates" ON public.project_updates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. Notification triggers
CREATE OR REPLACE FUNCTION public.notify_admin_service_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_rec RECORD;
BEGIN
  FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_rec.user_id, 'service_request',
      'New service request: ' || LEFT(NEW.title, 50),
      'طلب خدمة جديد: ' || LEFT(NEW.title, 50),
      NEW.contact_name || ' — ' || NEW.service_type, NULL,
      '/admin/service-requests',
      jsonb_build_object('request_id', NEW.id, 'service_type', NEW.service_type, 'budget', NEW.budget_range)
    );
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_new_service_request AFTER INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_service_request();

CREATE OR REPLACE FUNCTION public.notify_client_quote_sent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE req RECORD;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'sent' THEN
    SELECT sr.user_id, sr.contact_name, sr.contact_email INTO req
    FROM public.service_requests sr WHERE sr.id = NEW.service_request_id;
    IF req.user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        req.user_id, 'quote_received',
        'Quote received: ' || NEW.title,
        'تم استلام عرض سعر: ' || NEW.title,
        'Total: $' || NEW.total_usd || ' — Valid until: ' || COALESCE(NEW.valid_until::text, 'N/A'), NULL,
        '/my-projects',
        jsonb_build_object('quote_id', NEW.id, 'total', NEW.total_usd)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_quote_status_change AFTER UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_quote_sent();

CREATE OR REPLACE FUNCTION public.notify_client_project_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE proj RECORD;
BEGIN
  IF NEW.is_visible_to_client = true THEN
    SELECT pt.user_id, pt.title INTO proj FROM public.project_tracking pt WHERE pt.id = NEW.project_id;
    IF proj.user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        proj.user_id, 'project_update',
        'Update: ' || proj.title,
        'تحديث: ' || proj.title,
        NEW.title, NULL,
        '/my-projects/' || NEW.project_id,
        jsonb_build_object('project_id', NEW.project_id, 'update_type', NEW.type)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_project_update AFTER INSERT ON public.project_updates
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_project_update();

CREATE OR REPLACE FUNCTION public.notify_admin_quote_response()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_rec RECORD; req RECORD;
BEGIN
  IF OLD.status = 'sent' AND NEW.status IN ('approved', 'rejected') THEN
    SELECT sr.contact_name INTO req FROM public.service_requests sr WHERE sr.id = NEW.service_request_id;
    FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      PERFORM public.create_notification(
        admin_rec.user_id,
        CASE WHEN NEW.status = 'approved' THEN 'quote_approved' ELSE 'quote_rejected' END,
        COALESCE(req.contact_name, 'Client') || CASE WHEN NEW.status = 'approved' THEN ' approved ' ELSE ' rejected ' END || 'quote ' || NEW.quote_number,
        COALESCE(req.contact_name, 'العميل') || CASE WHEN NEW.status = 'approved' THEN ' وافق على ' ELSE ' رفض ' END || 'عرض السعر ' || NEW.quote_number,
        '$' || NEW.total_usd, NULL,
        '/admin/quotes',
        jsonb_build_object('quote_id', NEW.id, 'status', NEW.status)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_quote_response AFTER UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_quote_response();

-- 7. Auto-generate quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE next_num INTEGER; year_str TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'DW-Q-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num FROM public.quotes WHERE quote_number LIKE 'DW-Q-' || year_str || '-%';
  NEW.quote_number := 'DW-Q-' || year_str || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_quote_number BEFORE INSERT ON public.quotes
  FOR EACH ROW WHEN (NEW.quote_number IS NULL) EXECUTE FUNCTION public.generate_quote_number();

-- 8. Updated_at triggers
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_tracking_updated_at BEFORE UPDATE ON public.project_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Validation trigger for progress_pct (replacing CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_progress_pct()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.progress_pct < 0 OR NEW.progress_pct > 100 THEN
    RAISE EXCEPTION 'progress_pct must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_project_progress BEFORE INSERT OR UPDATE ON public.project_tracking
  FOR EACH ROW EXECUTE FUNCTION public.validate_progress_pct();
