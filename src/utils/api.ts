import axios from 'axios';
import { Asset, BinanceAsset, CandleData, BinanceAccount, TickerPrice, BinanceTrade, BinanceOrder } from '../types';
import { supabase } from '../lib/supabaseClient';

const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

// --- Funções de conversão de Símbolo ---
// AJUSTE: Modificado para usar '/' como separador, alinhando com a UI da Binance.
const toBinanceSymbol = (appSymbol: string): string => appSymbol.replace('/', '');

// --- Proxy Genérico para a API da Binance via Edge Function ---
const invokeBinanceProxy = async (path: string, params: Record<string, string> = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('binance-proxy', {
      body: { path, params }
    });
    // Se a função de borda retornar um erro estruturado, lance-o.
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error(`Erro ao invocar a função de borda para o caminho ${path}:`, error);
    // Relança o erro para que a função chamadora possa tratá-lo.
    // Isso é crucial para exibir mensagens de erro na UI.
    throw error;
  }
};


// --- Busca de Ativos Disponíveis ---
export const fetchAllBinanceAssets = async (): Promise<BinanceAsset[]> => {
  try {
    const { data } = await axios.get(`${BINANCE_API_BASE_URL}/exchangeInfo`);
    if (data && data.symbols) {
      const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'TUSD', 'FDUSD', 'DAI'];
      return data.symbols
        .filter((s: any) => s.status === 'TRADING' && STABLECOINS.includes(s.quoteAsset) && !s.symbol.includes('_'))
        .map((s: any): BinanceAsset => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          // AJUSTE: O símbolo interno agora usa '/', espelhando a UI da Binance, conforme a sugestão do usuário.
          appSymbol: `${s.baseAsset}/${s.quoteAsset}`,
        }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar todos os ativos da Binance:', error);
    return [];
  }
};

// --- Dados do Gráfico (da Binance) ---
const parseBinanceChartData = (data: any[]): CandleData[] => {
    if (!Array.isArray(data) || data.length === 0) {
        console.error("Formato de dados do gráfico inesperado ou vazio da Binance:", data);
        return [];
    }
    return data.map((kline: any[]) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
    })).filter(candle =>
        !isNaN(candle.open) &&
        !isNaN(candle.close) &&
        !isNaN(candle.high) &&
        !isNaN(candle.low)
    );
};


export const fetchChartData = async (symbol: string): Promise<CandleData[]> => {
  const binanceSymbol = toBinanceSymbol(symbol);
  
  const startTime = Date.now() - 48 * 60 * 60 * 1000; 

  try {
    const targetUrl = `${BINANCE_API_BASE_URL}/klines?symbol=${binanceSymbol}&interval=15m&startTime=${startTime}&limit=1000`;
    const response = await axios.get(targetUrl);
    return parseBinanceChartData(response.data);
  } catch (error) {
    console.error(`Erro ao buscar dados do gráfico para ${binanceSymbol} da Binance:`, error);
    return [];
  }
};

// --- Dados do Ticker (da Binance) ---
export const fetchBinanceTickerData = async (appSymbols: string[]): Promise<Asset[]> => {
  if (appSymbols.length === 0) return [];
  
  const binanceSymbols = appSymbols.map(toBinanceSymbol);
  const appSymbolMap = new Map(appSymbols.map(s => [toBinanceSymbol(s), s]));
  
  const endpoint = appSymbols.length === 1 
    ? `${BINANCE_API_BASE_URL}/ticker/24hr?symbol=${binanceSymbols[0]}`
    : `${BINANCE_API_BASE_URL}/ticker/24hr?symbols=${JSON.stringify(binanceSymbols)}`;

  try {
    const { data } = await axios.get(endpoint);
    const responseData = Array.isArray(data) ? data : [data];

    return responseData.map((ticker: any): Asset => {
      const appSymbol = appSymbolMap.get(ticker.symbol) || `${ticker.symbol}/UNKNOWN`;
      const price = parseFloat(ticker.lastPrice);
      const changePercent = parseFloat(ticker.priceChangePercent);
      const change = parseFloat(ticker.priceChange);

      return {
        symbol: appSymbol,
        // AJUSTE: A extração do nome agora usa '/' como separador.
        name: appSymbol.split('/')[0], // Usa o base asset como nome
        price: isNaN(price) ? 0 : price,
        change: isNaN(change) ? 0 : change,
        changePercent: isNaN(changePercent) ? 0 : changePercent,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar dados do ticker da Binance:', error);
    return appSymbols.map(symbol => ({
        symbol,
        // AJUSTE: A extração do nome agora usa '/' como separador.
        name: symbol.split('/')[0],
        price: 0,
        change: 0,
        changePercent: 0,
    }));
  }
};

// --- Preços de todos os Tickers ---
export const fetchAllTickerPrices = async (): Promise<Map<string, number>> => {
  try {
    const { data } = await axios.get<TickerPrice[]>(`${BINANCE_API_BASE_URL}/ticker/price`);
    const priceMap = new Map<string, number>();
    data.forEach(ticker => {
      priceMap.set(ticker.symbol, parseFloat(ticker.price));
    });
    return priceMap;
  } catch (error) {
    console.error('Erro ao buscar todos os preços de tickers:', error);
    return new Map();
  }
};


// --- Dados da Carteira Binance (via Edge Function) ---
export const fetchBinanceAccountData = async (): Promise<BinanceAccount> => {
  // A função invokeBinanceProxy já lança um erro em caso de falha.
  // O componente chamador (App.tsx) é responsável por tratar esse erro.
  return invokeBinanceProxy('/api/v3/account');
};

// --- Histórico de Trades (via Edge Function) ---
export const fetchBinanceMyTrades = async (symbol: string): Promise<BinanceTrade[]> => {
  const binanceSymbol = toBinanceSymbol(symbol);
  const startTime = (Date.now() - 7 * 24 * 60 * 60 * 1000).toString();
  // Adiciona o limite máximo para garantir que todos os dados sejam buscados
  const result = await invokeBinanceProxy('/api/v3/myTrades', { symbol: binanceSymbol, startTime, limit: '1000' });
  
  return Array.isArray(result) ? result : [];
};

// --- Ordens em Aberto (via Edge Function) ---
export const fetchBinanceOpenOrders = async (): Promise<BinanceOrder[]> => {
  // Este endpoint busca todas as ordens em aberto, por isso não precisa de 'symbol'
  const result = await invokeBinanceProxy('/api/v3/openOrders');
  return Array.isArray(result) ? result : [];
};

// --- Histórico de Todas as Ordens (via Edge Function) ---
export const fetchBinanceAllOrders = async (symbol: string): Promise<BinanceOrder[]> => {
  const binanceSymbol = toBinanceSymbol(symbol);
  const startTime = (Date.now() - 7 * 24 * 60 * 60 * 1000).toString();
  // Adiciona o limite máximo para garantir que todos os dados sejam buscados
  const result = await invokeBinanceProxy('/api/v3/allOrders', { symbol: binanceSymbol, startTime, limit: '1000' });

  return Array.isArray(result) ? result : [];
};
