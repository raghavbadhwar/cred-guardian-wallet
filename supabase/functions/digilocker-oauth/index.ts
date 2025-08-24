
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DigiLockerOAuthRequest {
  action: 'authorize' | 'callback';
  code?: string;
  state?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get auth token from request
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if DigiLocker credentials are configured
    const clientId = Deno.env.get('DIGILOCKER_CLIENT_ID');
    const clientSecret = Deno.env.get('DIGILOCKER_CLIENT_SECRET');
    const redirectUri = Deno.env.get('DIGILOCKER_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      console.log('DigiLocker credentials not configured, returning sandbox mode');
      return new Response(
        JSON.stringify({ 
          error: 'DigiLocker integration not available',
          message: 'API credentials not configured - using sandbox mode',
          sandbox: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, code, state }: DigiLockerOAuthRequest = await req.json();

    if (action === 'authorize') {
      // Generate authorization URL
      const stateParam = crypto.randomUUID();
      const authUrl = new URL('https://api.digitallocker.gov.in/public/oauth2/1/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', stateParam);
      authUrl.searchParams.set('scope', 'r_profile r_issueddocs');

      return new Response(
        JSON.stringify({ 
          authUrl: authUrl.toString(),
          state: stateParam 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback' && code) {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('DigiLocker token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to exchange authorization code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();

      // Store the connection in database
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
      
      const { error: dbError } = await supabase
        .from('digilocker_connections')
        .upsert({
          user_id: user.id,
          access_token: tokenData.access_token, // In production, encrypt this
          refresh_token: tokenData.refresh_token, // In production, encrypt this
          token_type: tokenData.token_type || 'Bearer',
          scope: tokenData.scope,
          expires_at: expiresAt.toISOString(),
        });

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Failed to store connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'DigiLocker connected successfully',
          expires_at: expiresAt.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('DigiLocker OAuth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
