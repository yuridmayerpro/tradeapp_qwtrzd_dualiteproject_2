import React, { useMemo } from 'react';
import { BinanceAccount, BinanceBalance } from '../types';
import { Wallet, ChevronDown, RefreshCw, AlertTriangle, LoaderCircle } from 'lucide-react';

interface BinanceWalletInfoProps {
  accountData: BinanceAccount | null;
  isLoading: boolean;
  error: Error | null;
  selectedAssetSymbol: string;
  onRetry: () => void;
  priceMap: Map<string, number> | null;
}

const formatNumber = (num: number, precision: number = 8) => {
  return parseFloat(num.toFixed(precision));
};

const formatCurrency = (num: number) => {
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getIconUrl = (asset: string) => {
    const base = asset.toLowerCase();
    return `https://assets.coincap.io/assets/icons/${base}@2x.png`;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://i.ibb.co/mJRc3Q4/generic-crypto.png';
};


const BinanceWalletInfo: React.FC<BinanceWalletInfoProps> = ({
  accountData,
  isLoading,
  error,
  selectedAssetSymbol,
  onRetry,
  priceMap,
}) => {
  // AJUSTE: A extração do ativo base agora usa '/' como separador.
  const selectedAssetBase = selectedAssetSymbol.split('/')[0];

  const { selectedAssetBalance, topBalances, totalWalletValue } = useMemo(() => {
    if (!accountData || !priceMap) {
      return { selectedAssetBalance: null, topBalances: [], totalWalletValue: 0 };
    }

    let totalValue = 0;
    const valuedBalances = accountData.balances
      .map(balance => {
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        const total = free + locked;
        if (total === 0) return null;

        let value = 0;
        if (balance.asset === 'USDT') {
          value = total;
        } else {
          const price = priceMap.get(`${balance.asset}USDT`);
          if (price) {
            value = total * price;
          }
        }
        totalValue += value;
        return { ...balance, total, value };
      })
      .filter((b): b is BinanceBalance & { total: number; value: number } => b !== null)
      .sort((a, b) => b.value - a.value);

    const selected = valuedBalances.find(b => b.asset === selectedAssetBase) || null;
    const top = valuedBalances.filter(b => b.asset !== selectedAssetBase).slice(0, 5);
    
    return { selectedAssetBalance: selected, topBalances: top, totalWalletValue: totalValue };
  }, [accountData, selectedAssetBase, priceMap]);

  const renderLoading = () => (
    <div className="px-6 space-y-4">
        <div className="flex justify-between items-center">
            <div className="h-6 w-1/3 bg-slate-700 rounded animate-pulse"></div>
            <div className="h-8 w-1/4 bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="h-20 bg-slate-700/50 rounded-lg animate-pulse"></div>
        <div className="h-40 bg-slate-700/50 rounded-lg animate-pulse"></div>
    </div>
  );

  const renderError = () => (
    <div className="px-6 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
      <p className="text-red-300 font-semibold mb-2">Falha ao carregar dados da carteira</p>
      <p className="text-sm text-slate-400 mb-4">{error?.message || 'Ocorreu um erro desconhecido.'}</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors"
      >
        <RefreshCw size={16} />
        Tentar Novamente
      </button>
    </div>
  );

  const renderContent = () => (
    <div className="px-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <p className="text-sm text-slate-400">Valor Total Estimado (Spot)</p>
                <p className="text-3xl font-bold text-white">
                    ${totalWalletValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <div className="text-xs text-slate-500">
                Atualizado em: {new Date(accountData?.updateTime || Date.now()).toLocaleTimeString('pt-BR')}
            </div>
        </div>

      {selectedAssetBalance && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-base font-semibold text-blue-200 mb-3">Ativo Selecionado na Carteira</h3>
          <div className="flex items-center gap-4">
            <img src={getIconUrl(selectedAssetBalance.asset)} onError={handleImageError} alt={selectedAssetBalance.asset} className="w-10 h-10 rounded-full" />
            <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400">Livre</p>
                <p className="font-mono text-sm text-white">{formatNumber(parseFloat(selectedAssetBalance.free))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Bloqueado</p>
                <p className="font-mono text-sm text-white">{formatNumber(parseFloat(selectedAssetBalance.locked))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="font-mono text-sm font-bold text-white">{formatNumber(selectedAssetBalance.total)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Valor (USDT)</p>
                <p className="font-mono text-sm font-bold text-white">~${selectedAssetBalance.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold text-slate-300 mb-3">Principais Ativos</h3>
        <div className="space-y-2">
          {topBalances.map(balance => (
            <div key={balance.asset} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <img src={getIconUrl(balance.asset)} onError={handleImageError} alt={balance.asset} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-bold text-white">{balance.asset}</p>
                  <p className="text-xs text-slate-400 font-mono">{formatNumber(balance.total)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white text-sm">~${balance.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          ))}
           {topBalances.length === 0 && !selectedAssetBalance && (
                <div className="text-center py-6">
                    <p className="text-slate-400">Nenhum ativo com saldo encontrado na carteira Spot.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <details className="bg-slate-800/50 rounded-xl border border-slate-700 open:pb-6 transition-all group">
      <summary className="p-6 cursor-pointer flex items-center justify-between list-none">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-bold text-white">Minha Carteira Binance</h2>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-300 transform group-open:rotate-180" />
      </summary>
      
      {isLoading && renderLoading()}
      {!isLoading && error && renderError()}
      {!isLoading && !error && accountData && renderContent()}
    </details>
  );
};

export default BinanceWalletInfo;
