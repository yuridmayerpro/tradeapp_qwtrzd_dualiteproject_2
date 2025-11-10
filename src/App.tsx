import React, { useState, useEffect, useCallback, useRef } from 'react';
import TickerBanner from './components/TickerBanner';
import CandlestickChart from './components/CandlestickChart';
import IndicatorCards from './components/IndicatorCards';
import ComparativeIndicatorChart from './components/ComparativeIndicatorChart';
import ParametersPanel from './components/ParametersPanel';
import SignalsPanel from './components/SignalsPanel';
import CurrentAssetBar from './components/CurrentAssetBar';
import AssetSearchModal from './components/AssetSearchModal';
import TimezoneSelector from './components/TimezoneSelector';
import AuthControl from './components/AuthControl';
import BinanceConnectModal from './components/BinanceConnectModal';
import BinanceWalletInfo from './components/BinanceWalletInfo';
import OrderHistoryPanel from './components/OrderHistoryPanel';
import { Asset, CandleData, IndicatorParams, Signal, IndicatorData, FullCandleData, BinanceAsset, BinanceAccount, BinanceTrade, BinanceOrder } from './types';
import { fetchChartData, fetchAllBinanceAssets, fetchBinanceTickerData, fetchBinanceAccountData, fetchAllTickerPrices, fetchBinanceMyTrades, fetchBinanceOpenOrders, fetchBinanceAllOrders } from './utils/api';
import { generateSignalsAndIndicators } from './utils/technicalIndicators';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import ToastContainer from './components/Toast';
import NotificationControl from './components/NotificationControl';

const FEATURED_ASSETS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT', 'DOGE/USDT', 'ADA/USDT', 'TRX/USDT'];
const DEFAULT_PARAMS: IndicatorParams = {
  adxPeriod: 14, adxThreshold: 20, slopeWindow: 14, slopeSmooth: 5, gogSpan: 5,
  swingLeft: 3, swingRight: 3, fiboRetrLow: 0.382, fiboRetrHigh: 0.618,
};

function App() {
  const { user, loading: authLoading } = useAuth();
  
  const [tickerAssets, setTickerAssets] = useState<Asset[]>([]);
  const [allBinanceAssets, setAllBinanceAssets] = useState<BinanceAsset[]>([]);
  const [priceMap, setPriceMap] = useState<Map<string, number> | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USDT');
  const [selectedAssetData, setSelectedAssetData] = useState<Asset | null>(null);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [fullData, setFullData] = useState<FullCandleData[]>([]);
  const [params, setParams] = useState<IndicatorParams>(DEFAULT_PARAMS);
  const [indicators, setIndicators] = useState<IndicatorData>({ adx: 0, slope: 0, gog: 0 });
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isBinanceModalOpen, setIsBinanceModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState<string>('America/Sao_Paulo');
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // State for Binance Data
  const [isBinanceConnected, setIsBinanceConnected] = useState(false);
  const [binanceAccountData, setBinanceAccountData] = useState<BinanceAccount | null>(null);
  const [isBinanceDataLoading, setIsBinanceDataLoading] = useState(false);
  const [binanceDataError, setBinanceDataError] = useState<Error | null>(null);
  
  const [binanceTrades, setBinanceTrades] = useState<BinanceTrade[]>([]);
  const [binanceOpenOrders, setBinanceOpenOrders] = useState<BinanceOrder[]>([]);
  const [binanceAllOrders, setBinanceAllOrders] = useState<BinanceOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<Error | null>(null);

  const saveParamsTimeoutRef = useRef<number | null>(null);
  const lastSignalRef = useRef<Signal | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('Service Worker registered with scope:', registration.scope))
        .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, []);

  const updateTickerData = useCallback(async () => {
    const data = await fetchBinanceTickerData(FEATURED_ASSETS);
    if (data.length > 0) {
      setTickerAssets(data);
    }
  }, []);

  const loadAssetData = useCallback(async (symbol: string) => {
    setIsLoading(true);
    const [chartData, ticker] = await Promise.all([
      fetchChartData(symbol),
      fetchBinanceTickerData([symbol])
    ]);

    setCandleData(chartData.length > 0 ? chartData : []);
    setSelectedAssetData(ticker.length > 0 ? ticker[0] : null);
    
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  const loadBinanceWalletData = useCallback(async (): Promise<BinanceAccount | null> => {
    if (!user || !isBinanceConnected) return null;
    setIsBinanceDataLoading(true);
    setBinanceDataError(null);
    try {
      const accountData = await fetchBinanceAccountData();
      setBinanceAccountData(accountData);
      return accountData;
    } catch (error: any) {
      setBinanceDataError(error);
      return null;
    } finally {
      setIsBinanceDataLoading(false);
    }
  }, [user, isBinanceConnected]);

  const loadFullBinanceHistory = useCallback(async (account: BinanceAccount, allAssets: BinanceAsset[]) => {
    if (!user || !isBinanceConnected) return;

    setIsOrdersLoading(true);
    setOrdersError(null);
    
    try {
      const openOrders = await fetchBinanceOpenOrders();
      setBinanceOpenOrders(openOrders);

      const ownedBaseAssets = new Set(
        account.balances
          .filter(b => parseFloat(b.free) + parseFloat(b.locked) > 0)
          .map(b => b.asset)
      );

      const symbolsToFetch = allAssets
        .filter(asset => ownedBaseAssets.has(asset.baseAsset))
        .map(asset => asset.appSymbol);

      let aggregatedTrades: BinanceTrade[] = [];
      let aggregatedAllOrders: BinanceOrder[] = [];

      for (const symbol of symbolsToFetch) {
        try {
          const [trades, allOrders] = await Promise.all([
            fetchBinanceMyTrades(symbol),
            fetchBinanceAllOrders(symbol),
          ]);
          aggregatedTrades.push(...trades);
          aggregatedAllOrders.push(...allOrders);
        } catch (e) {
          console.warn(`Não foi possível buscar o histórico para ${symbol}:`, e);
        }
      }
      
      aggregatedTrades.sort((a, b) => b.time - a.time);
      aggregatedAllOrders.sort((a, b) => b.time - a.time);

      setBinanceTrades(aggregatedTrades);
      setBinanceAllOrders(aggregatedAllOrders);

    } catch (error: any) {
      setOrdersError(error);
    } finally {
      setIsOrdersLoading(false);
    }
  }, [user, isBinanceConnected]);

  useEffect(() => {
    if (authLoading) return;

    const performInitialLoad = async () => {
      setIsLoading(true);
      let assetToLoad = 'BTC/USDT';
      let initialParams = { ...DEFAULT_PARAMS };
      let binanceConnected = false;

      if (user) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('binance_api_key, binance_secret_key, selected_asset, indicator_params')
          .eq('id', user.id)
          .single();
        
        if (data) {
          assetToLoad = data.selected_asset || assetToLoad;
          initialParams = data.indicator_params || initialParams;
          if (data.binance_api_key && data.binance_secret_key) {
            binanceConnected = true;
          }
        } else if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user settings:', error);
        }
      }
      
      setSelectedAsset(assetToLoad);
      setParams(initialParams);
      setIsBinanceConnected(binanceConnected);

      const [assets, prices] = await Promise.all([
        fetchAllBinanceAssets(),
        fetchAllTickerPrices()
      ]);
      setAllBinanceAssets(assets);
      setPriceMap(prices);
      
      await loadAssetData(assetToLoad);
      await updateTickerData();

      if (binanceConnected) {
        const accountData = await loadBinanceWalletData();
        if (accountData) {
          await loadFullBinanceHistory(accountData, assets);
        }
      }

      setIsInitialDataLoaded(true);
    };

    performInitialLoad();
  }, [user, authLoading, loadAssetData, updateTickerData, loadBinanceWalletData, loadFullBinanceHistory]);


  useEffect(() => {
    if (!isInitialDataLoaded) return;
    const tickerInterval = setInterval(updateTickerData, 60 * 1000);
    const chartInterval = setInterval(() => loadAssetData(selectedAsset), 5 * 60 * 1000);

    return () => {
      clearInterval(tickerInterval);
      clearInterval(chartInterval);
    };
  }, [isInitialDataLoaded, selectedAsset, loadAssetData, updateTickerData]);

  useEffect(() => {
    if (candleData.length > 0) {
      const { fullData: newFullData, signals: newSignals } = generateSignalsAndIndicators(candleData, params);
      setFullData(newFullData);
      if (newFullData.length > 0) {
        const lastIndicator = newFullData[newFullData.length - 1];
        setIndicators({
          adx: lastIndicator.adx,
          slope: lastIndicator.slope,
          gog: lastIndicator.gog
        });
      }
      const sortedSignals = newSignals.sort((a, b) => b.timestamp - a.timestamp);
      setSignals(sortedSignals);

      if (user && sortedSignals.length > 0 && isInitialDataLoaded) {
        const latestSignal = sortedSignals[0];
        if (lastSignalRef.current?.timestamp !== latestSignal.timestamp) {
          lastSignalRef.current = latestSignal;

          const title = `${latestSignal.type === 'BUY' ? '🟢' : '🔴'} Sinal de ${latestSignal.type}: ${selectedAsset}`;
          const body = `Preço: $${latestSignal.price.toFixed(2)}. Clique para ver os detalhes.`;
          
          supabase.functions.invoke('send-push-notification', {
            body: { title, body, url: window.location.href }
          }).catch(err => console.error("Failed to send push notification:", err));
        }
      }
    } else {
      setFullData([]);
      setSignals([]);
      setIndicators({ adx: 0, slope: 0, gog: 0 });
    }
  }, [candleData, params, user, selectedAsset, isInitialDataLoaded]);

  useEffect(() => {
    if (!isInitialDataLoaded || !user) return;

    if (saveParamsTimeoutRef.current) {
      clearTimeout(saveParamsTimeoutRef.current);
    }

    saveParamsTimeoutRef.current = window.setTimeout(async () => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          indicator_params: params,
          updated_at: new Date().toISOString()
        });
      if (error) console.error('Error saving indicator parameters:', error);
    }, 1500);

    return () => {
      if (saveParamsTimeoutRef.current) clearTimeout(saveParamsTimeoutRef.current);
    };
  }, [params, user, isInitialDataLoaded]);


  const handleAssetSelect = async (symbol: string) => {
    if (symbol === selectedAsset) {
      setIsAssetModalOpen(false);
      return;
    }
    
    setSelectedAsset(symbol);
    setIsAssetModalOpen(false);
    
    await loadAssetData(symbol);

    if (user) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          selected_asset: symbol,
          updated_at: new Date().toISOString()
        });
      if (error) console.error('Error saving selected asset:', error);
    }
  };

  const handleBinanceConnectSuccess = async () => {
    setIsBinanceConnected(true);
    setIsBinanceModalOpen(false);
    const accountData = await loadBinanceWalletData();
    if (accountData && allBinanceAssets.length > 0) {
      await loadFullBinanceHistory(accountData, allBinanceAssets);
    }
  };

  const adxHistory = fullData.map(d => d.adx);
  const gogHistory = fullData.map(d => d.gog);
  const slopeHistory = fullData.map(d => d.slope);
  const timestamps = candleData.map(d => new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: timezone }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 relative">
      <ToastContainer />
      {(isLoading && !isAssetModalOpen && !isBinanceModalOpen) && (
        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-50">
          <LoaderCircle className="w-16 h-16 text-blue-500 animate-spin" />
          <p className="mt-4 text-lg font-semibold">Carregando dados...</p>
        </div>
      )}
      <TickerBanner assets={tickerAssets} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Análise de Criptoativos
          </h1>
          <div className="flex items-center flex-wrap gap-4 justify-start md:justify-end">
            {lastUpdated && (
              <div className="text-xs text-slate-400">
                Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', { timeZone: timezone })}
              </div>
            )}
            <TimezoneSelector selectedTimezone={timezone} onTimezoneChange={setTimezone} />
            <NotificationControl />
            <AuthControl 
              onOpenBinanceConnect={() => setIsBinanceModalOpen(true)} 
            />
            <div className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 font-semibold text-sm">AO VIVO</span>
            </div>
          </div>
        </header>

        <CurrentAssetBar 
          assetData={selectedAssetData}
          onOpenModal={() => setIsAssetModalOpen(true)}
        />
        
        <AssetSearchModal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          onSelectAsset={handleAssetSelect}
          allAssets={allBinanceAssets}
          featuredAssets={FEATURED_ASSETS}
          selectedAsset={selectedAsset}
        />

        {user && (
          <BinanceConnectModal
            isOpen={isBinanceModalOpen}
            onClose={() => setIsBinanceModalOpen(false)}
            onConnectSuccess={handleBinanceConnectSuccess}
          />
        )}
        
        {isBinanceConnected && (
          <>
            <BinanceWalletInfo
              accountData={binanceAccountData}
              isLoading={isBinanceDataLoading}
              error={binanceDataError}
              selectedAssetSymbol={selectedAsset}
              onRetry={async () => {
                const accountData = await loadBinanceWalletData();
                if (accountData && allBinanceAssets.length > 0) {
                  await loadFullBinanceHistory(accountData, allBinanceAssets);
                }
              }}
              priceMap={priceMap}
            />
            <OrderHistoryPanel
              openOrders={binanceOpenOrders}
              allOrders={binanceAllOrders}
              tradeHistory={binanceTrades}
              isLoading={isOrdersLoading}
              error={ordersError}
              timezone={timezone}
            />
          </>
        )}

        <ParametersPanel params={params} onParamsChange={setParams} />

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <CandlestickChart 
              data={candleData}
              signals={signals}
              myTrades={binanceTrades.filter(t => t.symbol === toBinanceSymbol(selectedAsset))}
              selectedAsset={selectedAsset}
              timezone={timezone}
              timestamps={timestamps}
            />
            <ComparativeIndicatorChart 
              adxHistory={adxHistory}
              gogHistory={gogHistory}
              slopeHistory={slopeHistory}
              timestamps={timestamps}
            />
        </div>

        <IndicatorCards indicators={indicators} />

        <SignalsPanel signals={signals} timezone={timezone} />
      </main>
    </div>
  );
}

const toBinanceSymbol = (appSymbol: string): string => appSymbol.replace('/', '');

export default App;
