-- Create enhanced credentials table structure
ALTER TABLE credentials DROP CONSTRAINT IF EXISTS credentials_status_check;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS issuer_name TEXT;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS issuer_domain TEXT;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS issued_date DATE;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS expires_at DATE;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update status constraint
ALTER TABLE credentials ADD CONSTRAINT credentials_status_check CHECK (status IN ('valid', 'revoked', 'expired'));

-- Create shares table for secure credential sharing
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cred_id UUID REFERENCES credentials(id) ON DELETE CASCADE,
  policy JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  max_views INTEGER DEFAULT 10,
  views INTEGER DEFAULT 0,
  revoked BOOLEAN DEFAULT false,
  access_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create share_views table for tracking and fraud detection
CREATE TABLE IF NOT EXISTS share_views (
  id BIGSERIAL PRIMARY KEY,
  share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  country TEXT,
  city TEXT,
  ua_hash TEXT,
  referrer_domain TEXT,
  ok BOOLEAN DEFAULT true,
  access_code_attempt BOOLEAN DEFAULT false,
  ip_hash TEXT
);

-- Create folders table for organization
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create DigiLocker integration tables
CREATE TABLE IF NOT EXISTS digilocker_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  access_token TEXT, -- Should be encrypted in production
  refresh_token TEXT, -- Should be encrypted in production
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create imports tracking table
CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  status TEXT DEFAULT 'pending',
  is_verifiable BOOLEAN DEFAULT false,
  cid TEXT,
  anchored_tx TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create issuers table for white-label console
CREATE TABLE IF NOT EXISTS issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  theme JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create issuer templates
CREATE TABLE IF NOT EXISTS issuer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE digilocker_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuer_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shares
CREATE POLICY "Users can manage their own shares" 
ON shares FOR ALL 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for share_views (users can see views of their shares)
CREATE POLICY "Users can view their share analytics" 
ON share_views FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM shares 
  WHERE shares.id = share_views.share_id 
  AND shares.user_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
));

-- Public access policy for verifier portal (shares can be viewed by anyone with the ID)
CREATE POLICY "Public share verification access" 
ON shares FOR SELECT 
USING (NOT revoked AND expires_at > now());

-- RLS Policies for folders
CREATE POLICY "Users can manage their own folders" 
ON folders FOR ALL 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for digilocker_tokens
CREATE POLICY "Users can manage their own tokens" 
ON digilocker_tokens FOR ALL 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for imports
CREATE POLICY "Users can manage their own imports" 
ON imports FOR ALL 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for issuers (public read, admin write)
CREATE POLICY "Anyone can view issuers" 
ON issuers FOR SELECT 
USING (true);

CREATE POLICY "Issuers can manage their own data" 
ON issuers FOR ALL 
USING (id = (SELECT user_id FROM profiles WHERE id = auth.uid())::UUID);

-- RLS Policies for issuer_templates
CREATE POLICY "Anyone can view templates" 
ON issuer_templates FOR SELECT 
USING (true);

CREATE POLICY "Issuers can manage their own templates" 
ON issuer_templates FOR ALL 
USING (issuer_id = (SELECT user_id FROM profiles WHERE id = auth.uid())::UUID);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_credentials_payload ON credentials USING GIN (payload);
CREATE INDEX IF NOT EXISTS idx_credentials_search ON credentials (title, issuer_name);
CREATE INDEX IF NOT EXISTS idx_credentials_user_deleted ON credentials (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_shares_lookup ON shares (cred_id, expires_at, revoked);
CREATE INDEX IF NOT EXISTS idx_share_views_analytics ON share_views (share_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders (user_id);

-- Create trigger for updating updated_at on shares
CREATE OR REPLACE FUNCTION update_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_shares_updated_at
  BEFORE UPDATE ON shares
  FOR EACH ROW
  EXECUTE FUNCTION update_shares_updated_at();