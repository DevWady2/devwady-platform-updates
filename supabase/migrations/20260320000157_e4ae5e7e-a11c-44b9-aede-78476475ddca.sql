
-- Consulting experts table
CREATE TABLE public.consulting_experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL,
  role text NOT NULL,
  role_ar text NOT NULL,
  bio text,
  bio_ar text,
  avatar_url text,
  initials text NOT NULL,
  track text NOT NULL,
  track_ar text NOT NULL,
  specializations text[] DEFAULT '{}',
  specializations_ar text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  session_rate_usd numeric(10,2) NOT NULL DEFAULT 50.00,
  session_duration_minutes integer NOT NULL DEFAULT 60,
  is_active boolean DEFAULT true,
  email text,
  linkedin_url text,
  github_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Expert availability slots
CREATE TABLE public.expert_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid NOT NULL REFERENCES public.consulting_experts(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Consulting bookings
CREATE TABLE public.consulting_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid NOT NULL REFERENCES public.consulting_experts(id) ON DELETE CASCADE,
  user_id uuid,
  guest_name text,
  guest_email text,
  guest_phone text,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  track text,
  payment_status text DEFAULT 'unpaid',
  payment_intent_id text,
  amount_usd numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consulting_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_bookings ENABLE ROW LEVEL SECURITY;

-- Experts are publicly readable
CREATE POLICY "Experts are viewable by everyone" ON public.consulting_experts
  FOR SELECT TO public USING (true);

-- Availability is publicly readable
CREATE POLICY "Availability is viewable by everyone" ON public.expert_availability
  FOR SELECT TO public USING (true);

-- Bookings: anyone can insert (guest booking)
CREATE POLICY "Anyone can create bookings" ON public.consulting_bookings
  FOR INSERT TO public WITH CHECK (true);

-- Bookings: users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.consulting_bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can manage everything
CREATE POLICY "Admins can manage experts" ON public.consulting_experts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage availability" ON public.expert_availability
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage bookings" ON public.consulting_bookings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_consulting_experts_updated_at
  BEFORE UPDATE ON public.consulting_experts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consulting_bookings_updated_at
  BEFORE UPDATE ON public.consulting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
