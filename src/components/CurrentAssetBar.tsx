import React from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface CurrentAssetBarProps {
  assetData: Asset | null;
  onOpenModal: () => void;
}

const CurrentAssetBar: React.FC<CurrentAssetBarProps> = ({ assetData, onOpenModal }) => {
  const getIconUrl = (symbol: string) => {
    if (!symbol) return 'https://i.ibb.co/mJRc3Q4/generic-crypto.png';
    const base = symbol.split('-')[0].toLowerCase();
    return `https://assets.coincap.io/assets/icons/${base}@2x.png`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://i.ibb.co/mJRc3Q4/generic-crypto.png'; // A generic fallback icon
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        {assetData ? (
          <img 
            src={getIconUrl(assetData.symbol)} 
            alt={assetData.name} 
            className="w-10 h-10 rounded-full bg-slate-700"
            onError={handleImageError}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse"></div>
        )}
        <div>
          <p className="font-bold text-lg text-white">{assetData?.symbol || 'Carregando...'}</p>
          <p className="text-sm text-slate-400">{assetData?.name || '...'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between">
        {assetData ? (
          <div className="text-right">
            <p className="font-bold text-lg text-white">${assetData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
              assetData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {assetData.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{assetData.change.toFixed(2)} ({assetData.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <div className="h-6 w-28 bg-slate-700 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-slate-700 rounded animate-pulse"></div>
          </div>
        )}
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
        >
          <RefreshCw size={16} />
          Trocar Ativo
        </button>
      </div>
    </div>
  );
};

export default CurrentAssetBar;
