-- Create profiles table extensions and new tables for settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_share JSONB DEFAULT '{"expiry_minutes": 15}';

-- Sessions table for device management
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Backups table for tracking encrypted backups
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions
CREATE POLICY "Users can view their own sessions" 
ON sessions FOR SELECT 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own sessions" 
ON sessions FOR DELETE 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert sessions" 
ON sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update sessions" 
ON sessions FOR UPDATE 
USING (true);

-- RLS policies for backups
CREATE POLICY "Users can view their own backups" 
ON backups FOR SELECT 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create their own backups" 
ON backups FOR INSERT 
WITH CHECK (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own backups" 
ON backups FOR DELETE 
USING (user_id = (SELECT user_id FROM profiles WHERE id = auth.uid()));

-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for backups bucket
CREATE POLICY "Users can view their own backups in storage" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own backups" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own backups in storage" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);