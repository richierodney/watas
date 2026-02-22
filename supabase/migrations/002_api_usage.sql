-- API usage tracking (OpenAI calls per user)
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/select (no direct user access)
CREATE POLICY "Service role only for api_usage"
  ON public.api_usage FOR ALL
  USING (auth.role() = 'service_role');
