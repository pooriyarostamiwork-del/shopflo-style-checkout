CREATE TABLE public.telegram_chats (
  chat_id bigint PRIMARY KEY,
  username text,
  first_name text,
  phone text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  cart jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_chats TO service_role;
ALTER TABLE public.telegram_chats ENABLE ROW LEVEL SECURITY;