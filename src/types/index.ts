export interface Asset {
  symbol: string; // Format: BTC-USD
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// New type for data from Binance's exchangeInfo
export interface BinanceAsset {
  symbol: string; // Format: BTCUSDT
  baseAsset: string; // Format: BTC
  appSymbol: string; // Format: BTC-USD
}

export interface CandleData {
  timestamp: number;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
}

export interface IndicatorData {
  adx: number;
  slope: number;
  gog: number;
}

export interface FullCandleData extends CandleData, IndicatorData {
  isSwingHigh: boolean;
  isSwingLow: boolean;
}

export interface IndicatorParams {
  adxPeriod: number;
  adxThreshold: number;
  slopeWindow: number;
  slopeSmooth: number;
  gogSpan: number;
  swingLeft: number;
  swingRight: number;
  fiboRetrLow: number;
  fiboRetrHigh: number;
}

export interface Signal {
  timestamp: number;
  type: 'BUY' | 'SELL';
  price: number;
  reason: string;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
}

export interface UserSettings {
  id: string; // Corresponds to auth.users.id
  selected_asset: string;
  indicator_params: IndicatorParams;
  created_at: string;
  updated_at: string;
  binance_api_key?: string | null;
  binance_secret_key?: string | null;
}
