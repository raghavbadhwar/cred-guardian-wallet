import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const shareId = url.pathname.split('/').pop();

    if (!shareId) {
      return new Response(
        JSON.stringify({ error: 'Share ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = req.method === 'POST' ? await req.json() : {};
    const accessCode = body.access_code;

    console.log(`Verifying share ${shareId}`);

    // Get share details
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select(`
        *,
        credentials (*)
      `)
      .eq('id', shareId)
      .single();

    if (shareError || !share) {
      console.error('Share not found:', shareError);
      return new Response(
        JSON.stringify({
          status: 'not_found',
          checkedAt: new Date().toISOString()
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if share is revoked
    if (share.revoked) {
      return new Response(
        JSON.stringify({
          status: 'revoked',
          checkedAt: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if share is expired
    if (new Date(share.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          status: 'expired',
          checkedAt: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if max views exceeded
    if (share.views >= share.max_views) {
      return new Response(
        JSON.stringify({
          status: 'expired',
          checkedAt: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check access code if required
    if (share.access_code && share.access_code !== accessCode) {
      return new Response(
        JSON.stringify({
          status: 'invalid_code',
          requiresAccessCode: true,
          checkedAt: new Date().toISOString()
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract visitor information
    const userAgent = req.headers.get('user-agent') || '';
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const cfIpCountry = req.headers.get('cf-ipcountry') || 'unknown';
    const referer = req.headers.get('referer');

    // Simple IP hashing for privacy
    const ipHash = xForwardedFor ? 
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(xForwardedFor))
        .then(buffer => Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 8)) 
      : 'unknown';

    // Record the view
    const { error: viewError } = await supabase
      .from('share_views')
      .insert({
        share_id: shareId,
        country: cfIpCountry,
        ua_hash: userAgent ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userAgent))
          .then(buffer => Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .substring(0, 8)) : 'unknown',
        referrer_domain: referer ? new URL(referer).hostname : null,
        ip_hash: ipHash,
        ok: true,
        access_code_attempt: !!accessCode
      });

    if (viewError) {
      console.error('Error recording view:', viewError);
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('shares')
      .update({ views: share.views + 1 })
      .eq('id', shareId);

    if (updateError) {
      console.error('Error updating view count:', updateError);
    }

    // Apply policy filtering
    let filteredPayload = share.credentials.payload || {};
    
    if (share.policy.preset === 'lite') {
      // Only show essential fields for lite sharing
      const essentialFields = ['degree', 'institution', 'university', 'year', 'grade', 'title', 'student_name'];
      filteredPayload = Object.fromEntries(
        Object.entries(filteredPayload).filter(([key]) =>
          essentialFields.some(field => key.toLowerCase().includes(field))
        )
      );
    } else if (share.policy.preset === 'custom' && share.policy.fields) {
      // Only show selected fields for custom sharing
      filteredPayload = Object.fromEntries(
        Object.entries(filteredPayload).filter(([key]) =>
          share.policy.fields.includes(key)
        )
      );
    }

    // Simple fraud detection heuristics
    let fraudFlags = [];
    
    // Check for too many views
    if (share.views > Math.max(10, 30)) { // Simple threshold
      fraudFlags.push('high_views');
    }

    // Run additional heuristics in background (simplified for demo)
    console.log(`Fraud check for share ${shareId}: ${fraudFlags.length} flags`);

    // Return verification result
    const result = {
      status: 'valid',
      credential: {
        title: share.credentials.title,
        issuer_name: share.credentials.issuer_name,
        issuer_domain: share.credentials.issuer_domain,
        issued_date: share.credentials.issued_date,
        expires_at: share.credentials.expires_at,
        payload: filteredPayload
      },
      share: {
        created_at: share.created_at,
        views: share.views + 1,
        max_views: share.max_views,
        expires_at: share.expires_at,
        policy: share.policy
      },
      issuerTrusted: true, // In production, check against trust registry
      checkedAt: new Date().toISOString(),
      fraudFlags
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        checkedAt: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});