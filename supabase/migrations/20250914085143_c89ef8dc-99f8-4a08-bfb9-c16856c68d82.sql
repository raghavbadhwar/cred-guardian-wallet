-- First drop all existing policies on verifications table
DROP POLICY IF EXISTS "Public verification access" ON public.verifications;
DROP POLICY IF EXISTS "Public access to valid share verifications" ON public.verifications;
DROP POLICY IF EXISTS "Users can view verifications of their credentials" ON public.verifications;

-- Create secure policies:

-- 1. Allow public access only to verifications associated with valid shares
CREATE POLICY "Public access to valid share verifications" 
ON public.verifications 
FOR SELECT 
USING (
  share_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM public.shares s 
    WHERE s.id = verifications.share_id 
    AND s.revoked = false 
    AND s.expires_at > now()
  )
);

-- 2. Allow authenticated users to view verifications of their own credentials
CREATE POLICY "Users can view verifications of their credentials" 
ON public.verifications 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM public.credentials c 
    WHERE c.id = verifications.credential_id 
    AND c.user_id = auth.uid()
  )
);