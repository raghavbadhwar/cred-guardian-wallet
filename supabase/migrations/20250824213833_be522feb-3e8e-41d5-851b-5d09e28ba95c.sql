-- Add missing columns to existing credentials table
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS issuer_name TEXT;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS expires_at DATE;

-- Update title and issuer_name with existing values
UPDATE credentials SET title = type WHERE title IS NULL;
UPDATE credentials SET issuer_name = issuer WHERE issuer_name IS NULL;

-- Rename credential_data to payload
ALTER TABLE credentials RENAME COLUMN credential_data TO payload;

-- Update status constraint
ALTER TABLE credentials DROP CONSTRAINT IF EXISTS credentials_status_check;
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

-- Enable RLS on all new tables
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

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