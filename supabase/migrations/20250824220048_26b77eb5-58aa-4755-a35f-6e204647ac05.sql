-- Enhanced CredVerse database schema for advanced features

-- Add settings and preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"darkMode": false, "notifications": true, "telemetry": false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_preferences JSONB DEFAULT '{"enablePasskey": false, "appLock": false, "biometric": false, "twoFactor": false}';

-- Create audit logs table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs
CREATE POLICY "Users can view their own audit logs"
ON audit_logs FOR SELECT
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- Create import tracking table
CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('qr', 'file', 'paste', 'digilocker', 'email')),
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on imports
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;

-- Create policy for imports
CREATE POLICY "Users can manage their own imports"
ON imports FOR ALL
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_imports_user_id ON imports(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user_id_status ON credentials(user_id, status);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);

-- Add GIN index for full-text search on credentials payload
CREATE INDEX IF NOT EXISTS idx_credentials_payload_gin ON credentials USING GIN(payload);

-- Add trigram index for text search on title and issuer
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_credentials_text_search ON credentials USING GIN((title || ' ' || issuer || ' ' || issuer_name) gin_trgm_ops);

-- Update shares table with enhanced features
ALTER TABLE shares ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS geographic_restrictions JSONB DEFAULT '{}';
ALTER TABLE shares ADD COLUMN IF NOT EXISTS usage_analytics JSONB DEFAULT '{}';

-- Create share analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
  viewer_ip_hash TEXT,
  viewer_user_agent TEXT,
  location_data JSONB DEFAULT '{}',
  verification_result JSONB DEFAULT '{}',
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on share analytics
ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for share analytics
CREATE POLICY "Users can view analytics for their shares"
ON share_analytics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM shares s
  JOIN profiles p ON s.user_id = p.user_id
  WHERE s.id = share_analytics.share_id AND p.id = auth.uid()
));

-- Add verification tracking
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shares(id),
  credential_id UUID REFERENCES credentials(id),
  verifier_ip_hash TEXT,
  verification_status TEXT CHECK (verification_status IN ('valid', 'invalid', 'revoked', 'expired')),
  verification_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on verifications
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for verifications
CREATE POLICY "Public verification access"
ON verifications FOR SELECT
USING (true);

CREATE POLICY "Users can view verifications of their credentials"
ON verifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM credentials c
  WHERE c.id = verifications.credential_id AND c.user_id = auth.uid()
));

-- Create function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$;

-- Create function to update share analytics
CREATE OR REPLACE FUNCTION update_share_analytics(
  p_share_id UUID,
  p_analytics_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE shares 
  SET usage_analytics = COALESCE(usage_analytics, '{}'::jsonb) || p_analytics_data,
      updated_at = now()
  WHERE id = p_share_id;
END;
$$;