
-- LP-23: Seed course_questions for instructor Q&A flow + extra assistant invitation

-- Omar's React course — Sara asks (answered), Yasmin asks (unanswered)
INSERT INTO public.course_questions (id, course_id, asked_by, question_text, answer_text, answered_by, answered_at, is_visible_to_class, created_at) VALUES
  ('c0000001-0001-4000-8000-000000000001', 'ad20cb0e-0b46-4572-b36f-cb0e1f26fa47', '1c8fc43c-754b-48d4-9b8f-f48362747b3d',
   'How do I handle state management with useReducer vs useState in complex forms?',
   'For complex forms with many interdependent fields, useReducer gives you a clearer state transition model. useState is fine for simple independent fields.',
   '91a801a2-d61b-4df2-8cd7-f2c4b9f3527f', now() - interval '1 hour', true, now() - interval '2 hours'),
  ('c0000001-0002-4000-8000-000000000001', 'ad20cb0e-0b46-4572-b36f-cb0e1f26fa47', '32a6b8dc-8780-47f1-bceb-631378041a93',
   'What is the best approach for code-splitting with React.lazy and Suspense?',
   NULL, NULL, NULL, false, now() - interval '1 day');

-- Omar's Laravel course — Ahmed Zaki asks (unanswered)
INSERT INTO public.course_questions (id, course_id, asked_by, question_text, is_visible_to_class, created_at) VALUES
  ('c0000001-0003-4000-8000-000000000001', 'd8f8111b-1578-4748-ada0-49a5dd7124d3', '330a7418-f32c-42f1-9ea9-186e56592424',
   'How should I structure API resource controllers for nested relationships in Laravel?', false, now() - interval '6 hours');

-- Hassan's SDET Bootcamp — Fatima asks (answered), Sara asks (unanswered)
INSERT INTO public.course_questions (id, course_id, asked_by, question_text, answer_text, answered_by, answered_at, is_visible_to_class, created_at) VALUES
  ('c0000001-0004-4000-8000-000000000001', '3adbb855-8d93-4180-98b5-315d32db8b9d', 'ff1a3938-638f-4feb-b90b-b2d1f7a863ba',
   'What is the recommended approach for handling dynamic waits in Selenium WebDriver?',
   'Use WebDriverWait with ExpectedConditions instead of Thread.sleep. Explicit waits are more reliable and faster.',
   '50cf55fe-3e0f-44e5-941e-f24243218914', now() - interval '2 hours', true, now() - interval '3 hours'),
  ('c0000001-0005-4000-8000-000000000001', '3adbb855-8d93-4180-98b5-315d32db8b9d', '1c8fc43c-754b-48d4-9b8f-f48362747b3d',
   'Can you explain the Page Object Model pattern for large test suites?',
   NULL, NULL, NULL, false, now() - interval '5 hours');

-- Layla's DevOps course — Khalid asks (unanswered)
INSERT INTO public.course_questions (id, course_id, asked_by, question_text, is_visible_to_class, created_at) VALUES
  ('c0000001-0006-4000-8000-000000000001', '18e6a03e-cd4a-48a8-a25f-2214cbbfeeec', '14a83bb1-76a8-4d43-a9cd-408618f9761c',
   'What is the difference between Docker volumes and bind mounts for persistent storage?', false, now() - interval '4 hours');

-- Layla's AI/ML course — Dina asks (answered)
INSERT INTO public.course_questions (id, course_id, asked_by, question_text, answer_text, answered_by, answered_at, is_visible_to_class, created_at) VALUES
  ('c0000001-0007-4000-8000-000000000001', 'b37236e7-4ff9-473e-a805-5c086ddab0af', 'a371b0da-0579-4583-bce3-06579df01957',
   'How do I handle class imbalance in a multi-label classification task with TensorFlow?',
   'Use class_weight parameter in model.fit() or apply SMOTE for oversampling. For multi-label, focal loss is another strong option.',
   '7859913a-ac2e-4b5b-aa35-7bcad064e441', now() - interval '6 hours', true, now() - interval '8 hours');

-- Additional assistant invitation — Sara invited to Layla's DevOps (second freelancer)
INSERT INTO public.assistant_invitations (id, instructor_id, freelancer_id, course_id, role, status, compensation_type, duration, support_scope, message)
VALUES (
  'a1000001-0002-4000-8000-000000000001',
  '7859913a-ac2e-4b5b-aa35-7bcad064e441',
  '1c8fc43c-754b-48d4-9b8f-f48362747b3d',
  '18e6a03e-cd4a-48a8-a25f-2214cbbfeeec',
  'teaching_assistant',
  'pending',
  'stipend',
  '3 months',
  'Student Q&A support, assignment review',
  'Hi Sara, your strong frontend background would be great for supporting DevOps students. Interested?'
);
