-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_log;
DROP POLICY IF EXISTS "Service role can update email logs" ON public.email_log;

-- Create restrictive policies that block all user access for INSERT/UPDATE/DELETE
-- Service role bypasses RLS anyway, so these policies just block regular users
CREATE POLICY "No user inserts on email_log" 
ON public.email_log 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No user updates on email_log" 
ON public.email_log 
FOR UPDATE 
USING (false);

CREATE POLICY "No user deletes on email_log" 
ON public.email_log 
FOR DELETE 
USING (false);