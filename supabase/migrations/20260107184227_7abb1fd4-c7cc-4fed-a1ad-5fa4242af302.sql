-- Remove skip_weekends column from user_preferences table
ALTER TABLE public.user_preferences DROP COLUMN skip_weekends;

-- Update the trigger function to not include skip_weekends
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_preferences (user_id, email_enabled, email_frequency, journey_start_date)
  VALUES (NEW.id, true, 'daily', CURRENT_DATE);
  RETURN NEW;
END;
$function$;