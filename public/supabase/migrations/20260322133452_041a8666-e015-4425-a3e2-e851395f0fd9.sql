
ALTER TABLE public.expert_availability 
  ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN specific_date DATE;
