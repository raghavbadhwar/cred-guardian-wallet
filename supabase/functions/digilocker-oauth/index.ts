
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
  console.log('DigiLocker OAuth function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

    console.log('Authenticated user:', user.id);

    // Check if DigiLocker credentials are configured
    const clientId = Deno.env.get('DIGILOCKER_CLIENT_ID');
    const clientSecret = Deno.env.get('DIGILOCKER_CLIENT_SECRET');
    const redirectUri = Deno.env.get('DIGILOCKER_REDIRECT_URI');
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');

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
    console.log('Request body:', { action });

    if (action === 'authorize') {
      // Log security event
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'digilocker_oauth_initiate',
        p_resource_type: 'digilocker_connection',
        p_metadata: {
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('User-Agent')?.slice(0, 200) // Truncate for privacy
        },
        p_risk_level: 'low'
      });

      // Generate authorization URL
      const stateParam = crypto.randomUUID();
      const authUrl = new URL('https://api.digitallocker.gov.in/public/oauth2/1/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', stateParam);
      authUrl.searchParams.set('scope', 'r_profile r_issueddocs');

      console.log('Generated auth URL with state:', stateParam.slice(0, 8) + '...');

      return new Response(
        JSON.stringify({ 
          authUrl: authUrl.toString(),
          state: stateParam 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback' && code) {
      console.log('Processing OAuth callback');

      // Log callback attempt
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'digilocker_oauth_callback',
        p_resource_type: 'digilocker_connection',
        p_metadata: {
          timestamp: new Date().toISOString(),
          state: state?.slice(0, 10) + '...' // Truncate for privacy
        },
        p_risk_level: 'low'
      });

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
        
        // Log failed callback
        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_event_type: 'digilocker_oauth_callback_failed',
          p_resource_type: 'digilocker_connection',
          p_metadata: {
            error: errorText.slice(0, 500),
            timestamp: new Date().toISOString()
          },
          p_risk_level: 'medium'
        });

        return new Response(
          JSON.stringify({ error: 'Failed to exchange authorization code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful');

      // Encrypt tokens before storing (if encryption key is available)
      let accessToken = tokenData.access_token;
      let refreshToken = tokenData.refresh_token;

      if (encryptionKey) {
        try {
          // Use database encryption function
          const { data: encryptedAccess } = await supabase.rpc('encrypt_token', {
            token_text: accessToken
          });
          
          if (refreshToken) {
            const { data: encryptedRefresh } = await supabase.rpc('encrypt_token', {
              token_text: refreshToken
            });
            refreshToken = encryptedRefresh;
          }
          
          accessToken = encryptedAccess;
          console.log('Tokens encrypted successfully');
        } catch (encryptError) {
          console.warn('Token encryption failed, storing unencrypted:', encryptError);
          // Continue with unencrypted tokens if encryption fails
        }
      } else {
        console.warn('Encryption key not configured, storing tokens unencrypted');
      }

      // Store the connection in database
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
      
      const { error: dbError } = await supabase
        .from('digilocker_connections')
        .upsert({
          user_id: user.id,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: tokenData.token_type || 'Bearer',
          scope: tokenData.scope,
          expires_at: expiresAt.toISOString(),
          subject_id: tokenData.sub,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        
        // Log database error
        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_event_type: 'digilocker_oauth_db_error',
          p_resource_type: 'digilocker_connection',
          p_metadata: {
            error: dbError.message,
            timestamp: new Date().toISOString()
          },
          p_risk_level: 'high'
        });

        return new Response(
          JSON.stringify({ error: 'Failed to store connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('DigiLocker connection stored successfully');

      // Log successful connection
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'digilocker_connected',
        p_resource_type: 'digilocker_connection',
        p_metadata: {
          timestamp: new Date().toISOString(),
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          expires_in: tokenData.expires_in,
          encrypted: !!encryptionKey
        },
        p_risk_level: 'low'
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'DigiLocker connected successfully',
          expires_at: expiresAt.toISOString(),
          connection_id: user.id,
          encrypted: !!encryptionKey
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
