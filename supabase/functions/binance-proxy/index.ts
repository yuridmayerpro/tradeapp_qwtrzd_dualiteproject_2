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
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const BINANCE_API_URL = 'https://api.binance.com';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { path, params } = await req.json();
    if (!path) {
      throw new Error('O caminho do endpoint da API é obrigatório.');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Token de usuário inválido.');
    }

    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('binance_api_key, binance_secret_key')
      .eq('id', user.id)
      .single();

    if (settingsError || !settings?.binance_api_key || !settings?.binance_secret_key) {
      if (settingsError && settingsError.code === 'PGRST116') {
        throw new Error('Chaves da API Binance não configuradas.');
      }
      throw new Error('Não foi possível buscar as chaves da API Binance.');
    }

    const { binance_api_key: apiKey, binance_secret_key: secretKey } = settings;

    const timestamp = Date.now();
    const recvWindow = 5000;
    
    const fullParams = { ...params, timestamp: timestamp.toString(), recvWindow: recvWindow.toString() };
    const queryString = new URLSearchParams(fullParams).toString();
    
    const signature = await createHmacSha256Signature(secretKey, queryString);
    const url = `${BINANCE_API_URL}${path}?${queryString}&signature=${signature}`;

    const binanceResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    const responseBody = await binanceResponse.json();

    if (!binanceResponse.ok) {
      throw new Error(`Erro da API Binance: ${responseBody.msg || 'Verifique suas chaves e permissões.'} (Code: ${responseBody.code})`);
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in binance-proxy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
