-- Create table for long-lived email login tokens
CREATE TABLE public.email_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage tokens (edge functions use service role)
-- No user-facing policies needed since users access via edge function

-- Index for fast token lookups
CREATE INDEX idx_email_tokens_token ON public.email_tokens(token);
CREATE INDEX idx_email_tokens_user_id ON public.email_tokens(user_id);
CREATE INDEX idx_email_tokens_expires_at ON public.email_tokens(expires_at);