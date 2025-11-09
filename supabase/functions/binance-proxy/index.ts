import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Helper to create HMAC-SHA256 signature using modern Web Crypto API
async function createHmacSha256Signature(secretKey: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const BINANCE_API_URL = 'https://api.binance.com';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Token de usuário inválido.');
    }

    // 3. Fetch user's Binance API keys from the database
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('binance_api_key, binance_secret_key')
      .eq('id', user.id)
      .single();

    if (settingsError || !settings?.binance_api_key || !settings?.binance_secret_key) {
      if (settingsError && settingsError.code === 'PGRST116') { // No rows found
        throw new Error('Chaves da API Binance não configuradas. Por favor, conecte sua conta.');
      }
      throw new Error('Não foi possível buscar as chaves da API Binance.');
    }

    const { binance_api_key: apiKey, binance_secret_key: secretKey } = settings;

    // 4. Prepare and sign the request for Binance
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await createHmacSha256Signature(secretKey, queryString);

    const url = `${BINANCE_API_URL}/api/v3/account?${queryString}&signature=${signature}`;

    // 5. Make the request to Binance
    const binanceResponse = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    const responseBody = await binanceResponse.json();

    // 6. Handle Binance API errors
    if (!binanceResponse.ok) {
      throw new Error(`Erro da API Binance: ${responseBody.msg || 'Verifique suas chaves de API e permissões.'} (Code: ${responseBody.code})`);
    }

    // 7. Return successful response
    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Catch-all for any other errors
    console.error('Error in binance-proxy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
