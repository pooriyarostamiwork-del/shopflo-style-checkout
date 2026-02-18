
-- Enable RLS on otp_codes but keep it service-role only
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- No policies = only service role can access
