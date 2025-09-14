-- Remove the overly permissive public verification access policy
DROP POLICY IF EXISTS "Public verification access" ON public.verifications;

-- Create a more secure policy that only allows public access to verifications 
-- that are associated with valid, non-revoked, non-expired shares
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

-- Ensure authenticated users can still view verifications of their own credentials
-- (This policy already exists but keeping it for clarity)
-- "Users can view verifications of their credentials" policy remains unchanged