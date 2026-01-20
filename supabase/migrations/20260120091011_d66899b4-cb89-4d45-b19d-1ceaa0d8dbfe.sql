-- Add explicit UPDATE policy that denies all user access
-- Service role bypasses RLS, so edge functions will still work
CREATE POLICY "No user updates on email_tokens"
ON public.email_tokens
FOR UPDATE
USING (false);

-- Also add explicit policies for other operations to be crystal clear about security intent
CREATE POLICY "No user selects on email_tokens"
ON public.email_tokens
FOR SELECT
USING (false);

CREATE POLICY "No user inserts on email_tokens"
ON public.email_tokens
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No user deletes on email_tokens"
ON public.email_tokens
FOR DELETE
USING (false);