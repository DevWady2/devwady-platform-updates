
-- Remove duplicate team members, keeping the one with 'engineering' department (or first by id)
DELETE FROM public.team_members
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name_en, role_en ORDER BY 
      CASE WHEN department = 'engineering' THEN 0 WHEN department = 'leadership' THEN 0 WHEN department = 'qa' THEN 0 ELSE 1 END,
      id
    ) as rn
    FROM public.team_members
  ) ranked
  WHERE rn > 1
);

-- Standardize 'development' to 'engineering'
UPDATE public.team_members SET department = 'engineering' WHERE department = 'development';
