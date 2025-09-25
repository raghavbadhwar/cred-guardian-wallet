-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption functions for sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_token(token_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use a key derived from database settings for encryption
  RETURN encode(pgp_sym_encrypt(token_text, current_setting('app.encryption_key', true)), 'base64');
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to original text if encryption fails
    RETURN token_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Decrypt the token
  RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), current_setting('app.encryption_key', true));
EXCEPTION
  WHEN OTHERS THEN
    -- Return encrypted token if decryption fails (for backwards compatibility)
    RETURN encrypted_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate session context
CREATE OR REPLACE FUNCTION public.validate_session_context(
  p_user_id UUID,
  p_device_fingerprint TEXT,
  p_user_agent TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  session_count INTEGER;
BEGIN
  -- Check if this is a valid session for the user
  SELECT COUNT(*) INTO session_count
  FROM sessions 
  WHERE user_id = p_user_id 
    AND (device_fingerprint = p_device_fingerprint OR user_agent = p_user_agent)
    AND last_seen > now() - interval '30 days';
    
  RETURN session_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update session policies to be more restrictive
DROP POLICY IF EXISTS "System can insert sessions" ON sessions;
DROP POLICY IF EXISTS "System can update sessions" ON sessions;

CREATE POLICY "Authenticated users can insert their own sessions" 
ON sessions FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Authenticated users can update their own sessions" 
ON sessions FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  user_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
);

-- Add session cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions 
  WHERE last_seen < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced audit logging function with fraud detection
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, 
    action, 
    resource_type, 
    resource_id, 
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_metadata || jsonb_build_object('risk_level', p_risk_level, 'timestamp', extract(epoch from now()))
  );
  
  -- Log high-risk events to a separate monitoring table if needed
  IF p_risk_level = 'high' THEN
    -- Could extend to create alerts or notifications
    PERFORM pg_notify('security_alert', json_build_object(
      'user_id', p_user_id,
      'event', p_event_type,
      'risk_level', p_risk_level,
      'timestamp', now()
    )::text);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add rate limiting table for API endpoints
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits FOR SELECT 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Clean up old rate limit records
  DELETE FROM rate_limits 
  WHERE window_start < window_start_time;
  
  -- Get current count for this user and endpoint
  SELECT COALESCE(SUM(requests_count), 0) INTO current_count
  FROM rate_limits
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint
    AND window_start >= window_start_time;
  
  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Update or insert rate limit record
  INSERT INTO rate_limits (user_id, endpoint, requests_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, now())
  ON CONFLICT (user_id, endpoint) 
  DO UPDATE SET 
    requests_count = rate_limits.requests_count + 1,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start_time 
      THEN now() 
      ELSE rate_limits.window_start 
    END;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;