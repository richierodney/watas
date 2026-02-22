-- App settings (key-value). Used by backend with service role only.
-- e.g. openai_chat_model: gpt-4o | gpt-5

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (backend) can read/write.

INSERT INTO public.app_settings (key, value)
VALUES ('openai_chat_model', 'gpt-4o')
ON CONFLICT (key) DO NOTHING;
