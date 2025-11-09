export interface Asset {
  symbol: string; // Format: BTC-USDT
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// New type for data from Binance's exchangeInfo
export interface BinanceAsset {
  symbol: string; // Format: BTCUSDT
  baseAsset: string; // Format: BTC
  quoteAsset: string; // Format: USDT
  appSymbol: string; // Format: BTC-USDT
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

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface BinanceAccount {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: BinanceBalance[];
  permissions: string[];
}

export interface TickerPrice {
  symbol: string;
  price: string;
}

// --- Tipos para Histórico de Ordens e Trades ---
export interface BinanceOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';
  timeInForce: string;
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';
  side: 'BUY' | 'SELL';
  time: number;
  updateTime: number;
  isWorking: boolean;
}

export interface BinanceTrade {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
}
