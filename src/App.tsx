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
import { Asset, CandleData, IndicatorParams, Signal, IndicatorData, FullCandleData, BinanceAsset } from './types';
import { fetchChartData, fetchAllBinanceAssets, fetchBinanceTickerData } from './utils/api';
import { generateSignalsAndIndicators } from './utils/technicalIndicators';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';

const FEATURED_ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'BNB-USD', 'DOGE-USD', 'TRX-USD', 'USDC-USD'];
const DEFAULT_PARAMS: IndicatorParams = {
  adxPeriod: 14, adxThreshold: 20, slopeWindow: 14, slopeSmooth: 5, gogSpan: 5,
  swingLeft: 3, swingRight: 3, fiboRetrLow: 0.382, fiboRetrHigh: 0.618,
};

function App() {
  const { user, loading: authLoading } = useAuth();
  
  const [tickerAssets, setTickerAssets] = useState<Asset[]>([]);
  const [allBinanceAssets, setAllBinanceAssets] = useState<BinanceAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC-USD');
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

  const saveParamsTimeoutRef = useRef<number | null>(null);

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

  // Main data loading effect
  useEffect(() => {
    if (authLoading) return;

    const performInitialLoad = async () => {
      setIsLoading(true);
      let assetToLoad = 'BTC-USD';
      let initialParams = { ...DEFAULT_PARAMS };

      if (user) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          assetToLoad = data.selected_asset || assetToLoad;
          initialParams = data.indicator_params || initialParams;
        } else if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user settings:', error);
        }
      }
      
      setSelectedAsset(assetToLoad);
      setParams(initialParams);

      const assets = await fetchAllBinanceAssets();
      setAllBinanceAssets(assets);
      
      await Promise.all([
        updateTickerData(),
        loadAssetData(assetToLoad)
      ]);

      setIsInitialDataLoaded(true);
    };

    performInitialLoad();
  }, [user, authLoading, loadAssetData, updateTickerData]);


  // Interval updates
  useEffect(() => {
    if (!isInitialDataLoaded) return;
    const tickerInterval = setInterval(updateTickerData, 60 * 1000);
    const chartInterval = setInterval(() => loadAssetData(selectedAsset), 5 * 60 * 1000);

    return () => {
      clearInterval(tickerInterval);
      clearInterval(chartInterval);
    };
  }, [isInitialDataLoaded, selectedAsset, loadAssetData, updateTickerData]);

  // Indicator and signal generation
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
      setSignals(newSignals.sort((a, b) => b.timestamp - a.timestamp));
    } else {
      setFullData([]);
      setSignals([]);
      setIndicators({ adx: 0, slope: 0, gog: 0 });
    }
  }, [candleData, params]);

  // Debounced saving of indicator parameters
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
    loadAssetData(symbol);
    setIsAssetModalOpen(false);

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

  const adxHistory = fullData.map(d => d.adx);
  const gogHistory = fullData.map(d => d.gog);
  const slopeHistory = fullData.map(d => d.slope);
  const timestamps = candleData.map(d => new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: timezone }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 relative">
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
            <AuthControl onOpenBinanceConnect={() => setIsBinanceModalOpen(true)} />
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
          />
        )}

        <ParametersPanel params={params} onParamsChange={setParams} />

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <CandlestickChart 
              data={candleData}
              signals={signals}
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

export default App;
