import axios from 'axios';
import { Asset, BinanceAsset, CandleData, BinanceAccount, TickerPrice } from '../types';
import { supabase } from '../lib/supabaseClient';

const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

// --- Funções de conversão de Símbolo ---
const toBinanceSymbol = (appSymbol: string): string => appSymbol.replace('-', '');

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
          appSymbol: `${s.baseAsset}-${s.quoteAsset}`,
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
  
  // AJUSTE: Garante que a busca de dados seja sempre para as últimas 48 horas a partir do momento atual.
  const startTime = Date.now() - 48 * 60 * 60 * 1000; 

  try {
    // Para um intervalo de 15m, 48 horas correspondem a 192 velas (48 * 4).
    // O limite de 1000 é mais que suficiente para capturar todos os dados necessários.
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
      const appSymbol = appSymbolMap.get(ticker.symbol) || `${ticker.symbol}-UNKNOWN`;
      const price = parseFloat(ticker.lastPrice);
      const changePercent = parseFloat(ticker.priceChangePercent);
      const change = parseFloat(ticker.priceChange);

      return {
        symbol: appSymbol,
        name: appSymbol.split('-')[0], // Usa o base asset como nome
        price: isNaN(price) ? 0 : price,
        change: isNaN(change) ? 0 : change,
        changePercent: isNaN(changePercent) ? 0 : changePercent,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar dados do ticker da Binance:', error);
    return appSymbols.map(symbol => ({
        symbol,
        name: symbol.split('-')[0],
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
  try {
    // A função de borda usa o token de autenticação do usuário automaticamente
    const { data, error } = await supabase.functions.invoke('binance-proxy');

    if (error) throw error;
    // A função de borda pode retornar um erro de negócio em `data`
    if (data.error) throw new Error(data.error);

    return data as BinanceAccount;
  } catch (error) {
    console.error('Erro ao invocar a função de borda `binance-proxy`:', error);
    throw error; // Re-lança para que o componente possa tratar o estado de erro
  }
};
