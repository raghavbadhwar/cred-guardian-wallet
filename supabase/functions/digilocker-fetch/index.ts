
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DigiLockerDocument {
  id: string;
  name: string;
  type: string;
  issuer: string;
  issued_date: string;
  metadata: any;
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
    const apiBaseUrl = Deno.env.get('DIGILOCKER_API_BASE_URL') || 'https://api.digitallocker.gov.in/public';
    
    if (!Deno.env.get('DIGILOCKER_CLIENT_ID')) {
      console.log('DigiLocker credentials not configured, returning sandbox documents');
      
      // Return mock documents for sandbox mode
      const mockDocuments: DigiLockerDocument[] = [
        {
          id: 'mock-aadhaar-2024',
          name: 'Aadhaar Card (Masked)',
          type: 'AADHAAR',
          issuer: 'Unique Identification Authority of India',
          issued_date: '2024-01-15',
          metadata: { category: 'certificate', verified: true }
        },
        {
          id: 'mock-pan-2023',
          name: 'Permanent Account Number',
          type: 'PAN',
          issuer: 'Income Tax Department',
          issued_date: '2023-08-20',
          metadata: { category: 'certificate', verified: true }
        },
        {
          id: 'mock-degree-2024',
          name: 'Bachelor of Technology Degree',
          type: 'DEGREE',
          issuer: 'National Institute of Technology',
          issued_date: '2024-06-30',
          metadata: { category: 'degree', verified: true }
        }
      ];

      return new Response(
        JSON.stringify({ 
          documents: mockDocuments,
          sandbox: true,
          message: 'Sandbox mode - mock documents returned'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's DigiLocker connection
    const { data: connection, error: connectionError } = await supabase
      .from('digilocker_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: 'DigiLocker connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(connection.expires_at);
    if (now >= expiresAt) {
      return new Response(
        JSON.stringify({ error: 'DigiLocker token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch documents from DigiLocker API
    const documentsResponse = await fetch(`${apiBaseUrl}/v1/issueddocs`, {
      headers: {
        'Authorization': `${connection.token_type} ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!documentsResponse.ok) {
      const errorText = await documentsResponse.text();
      console.error('DigiLocker API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch documents from DigiLocker' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const documentsData = await documentsResponse.json();
    
    // Transform DigiLocker documents to our format
    const documents: DigiLockerDocument[] = documentsData.items?.map((doc: any) => ({
      id: doc.uri || doc.id,
      name: doc.name || doc.docname,
      type: doc.type || doc.doctype,
      issuer: doc.issuer || doc.issuerid,
      issued_date: doc.date || doc.issuedate,
      metadata: {
        category: mapDocumentCategory(doc.type || doc.doctype),
        verified: true,
        original_data: doc
      }
    })) || [];

    // Update last sync timestamp
    await supabase
      .from('digilocker_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    return new Response(
      JSON.stringify({ 
        documents,
        sandbox: false,
        synced_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('DigiLocker fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to map DigiLocker document types to our categories
function mapDocumentCategory(docType: string): 'degree' | 'certificate' | 'transcript' | 'diploma' {
  const type = docType?.toLowerCase() || '';
  
  if (type.includes('degree') || type.includes('graduation')) return 'degree';
  if (type.includes('diploma')) return 'diploma';
  if (type.includes('transcript') || type.includes('marksheet')) return 'transcript';
  
  return 'certificate';
}
