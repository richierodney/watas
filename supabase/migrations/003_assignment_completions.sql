-- Assignment completions: students (logged-in users) can mark assignments as done.
-- Only for users with accounts; works for both PRO and non-PRO.

CREATE TABLE IF NOT EXISTS public.assignment_completions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_completions_user_id
  ON public.assignment_completions(user_id);

ALTER TABLE public.assignment_completions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own completions
CREATE POLICY "Users can read own completions"
  ON public.assignment_completions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own completions"
  ON public.assignment_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own completions (to unmark)
CREATE POLICY "Users can delete own completions"
  ON public.assignment_completions FOR DELETE
  USING (auth.uid() = user_id);
