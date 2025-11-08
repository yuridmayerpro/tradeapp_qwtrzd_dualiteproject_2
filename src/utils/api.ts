import axios from 'axios';
import { Asset, BinanceAsset, CandleData } from '../types';

const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

// Mapeamento para nomes amigáveis. Pode ser expandido ou substituído no futuro.
const SYMBOL_TO_NAME_MAP: { [key: string]: string } = {
  'BTC-USD': 'Bitcoin',
  'ETH-USD': 'Ethereum',
  'SOL-USD': 'Solana',
  'XRP-USD': 'XRP',
  'BNB-USD': 'BNB',
  'DOGE-USD': 'Dogecoin',
  'TRX-USD': 'TRON',
  'USDC-USD': 'USD Coin',
  'USDT-USD': 'Tether',
};

// --- Funções de conversão de Símbolo ---
const toBinanceSymbol = (appSymbol: string): string => appSymbol.replace('-USD', 'USDT');
const fromBinanceSymbol = (binanceSymbol: string): string => binanceSymbol.replace(/USDT$/, '-USD');

// --- Busca de Ativos Disponíveis ---
export const fetchAllBinanceAssets = async (): Promise<BinanceAsset[]> => {
  try {
    const { data } = await axios.get(`${BINANCE_API_BASE_URL}/exchangeInfo`);
    if (data && data.symbols) {
      return data.symbols
        .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT' && !s.symbol.includes('_'))
        .map((s: any): BinanceAsset => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          appSymbol: fromBinanceSymbol(s.symbol),
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
  if (symbol === 'USDT-USD') {
    console.warn("Não é possível buscar dados do gráfico para USDT-USD.");
    return [];
  }
  
  const binanceSymbol = toBinanceSymbol(symbol);
  const startTime = new Date().setUTCHours(0, 0, 0, 0);

  try {
    const targetUrl = `${BINANCE_API_BASE_URL}/klines?symbol=${binanceSymbol}&interval=5m&startTime=${startTime}&limit=1000`;
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
  
  const endpoint = appSymbols.length === 1 
    ? `${BINANCE_API_BASE_URL}/ticker/24hr?symbol=${binanceSymbols[0]}`
    : `${BINANCE_API_BASE_URL}/ticker/24hr?symbols=${JSON.stringify(binanceSymbols)}`;

  try {
    const { data } = await axios.get(endpoint);
    const responseData = Array.isArray(data) ? data : [data];

    return responseData.map((ticker: any): Asset => {
      const appSymbol = fromBinanceSymbol(ticker.symbol);
      const price = parseFloat(ticker.lastPrice);
      const changePercent = parseFloat(ticker.priceChangePercent);
      const change = parseFloat(ticker.priceChange);

      return {
        symbol: appSymbol,
        name: SYMBOL_TO_NAME_MAP[appSymbol] || appSymbol.split('-')[0], // Fallback para o nome base
        price: isNaN(price) ? 0 : price,
        change: isNaN(change) ? 0 : change,
        changePercent: isNaN(changePercent) ? 0 : changePercent,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar dados do ticker da Binance:', error);
    return appSymbols.map(symbol => ({
        symbol,
        name: SYMBOL_TO_NAME_MAP[symbol] || symbol.split('-')[0],
        price: 0,
        change: 0,
        changePercent: 0,
    }));
  }
};
