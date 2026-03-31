
-- Blog posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ar text,
  slug text UNIQUE NOT NULL,
  excerpt text,
  excerpt_ar text,
  content text,
  content_ar text,
  cover_image_url text,
  category text,
  author_name text,
  author_avatar_url text,
  status text NOT NULL DEFAULT 'draft',
  read_time_minutes integer DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

-- Portfolio projects table
CREATE TABLE public.portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text,
  subtitle_en text,
  subtitle_ar text,
  slug text UNIQUE NOT NULL,
  description_en text,
  description_ar text,
  category text DEFAULT 'web',
  img_key text,
  cover_image_url text,
  tech text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  badge text,
  badge_ar text,
  external_url text,
  sort_order integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Team members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text,
  role_en text,
  role_ar text,
  bio_en text,
  bio_ar text,
  avatar_url text,
  email text,
  linkedin_url text,
  github_url text,
  department text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contact submissions table
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Blog posts: public read for published, admin full access
CREATE POLICY "Published blog posts viewable by everyone" ON public.blog_posts
  FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Portfolio projects: public read for published, admin full access
CREATE POLICY "Published projects viewable by everyone" ON public.portfolio_projects
  FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Admins can manage portfolio projects" ON public.portfolio_projects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Team members: public read for active, admin full access
CREATE POLICY "Active team members viewable by everyone" ON public.team_members
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage team members" ON public.team_members
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Contact submissions: anyone can insert, admin can read/manage
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage contact submissions" ON public.contact_submissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for CMS media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage RLS
CREATE POLICY "Media files are publicly readable" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Admins can upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
