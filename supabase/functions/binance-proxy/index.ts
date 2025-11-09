import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HmacSha256 } from 'https://deno.land/std@0.168.0/crypto/hmac.ts';

const BINANCE_API_URL = 'https://api.binance.com';

// Funções de cabeçalho CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Trata a requisição preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Cabeçalho de autorização ausente.');
    }

    // Cria um cliente Supabase com o token de autenticação do usuário
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Obtém o usuário a partir do token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Token de usuário inválido ou expirado.');
    }

    // Busca as chaves da Binance do usuário no banco de dados
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('binance_api_key, binance_secret_key')
      .eq('id', user.id)
      .single();

    if (settingsError || !settings || !settings.binance_api_key || !settings.binance_secret_key) {
      throw new Error('Chaves da API Binance não encontradas ou incompletas para este usuário.');
    }

    const { binance_api_key: apiKey, binance_secret_key: secretKey } = settings;

    // Cria a requisição assinada para a Binance
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    
    const signature = new HmacSha256(secretKey)
      .update(queryString)
      .hex();

    const url = `${BINANCE_API_URL}/api/v3/account?${queryString}&signature=${signature}`;

    const binanceResponse = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    const responseBody = await binanceResponse.json();

    if (!binanceResponse.ok) {
        throw new Error(`Erro da API Binance: ${responseBody.msg || 'Erro desconhecido'}`);
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
