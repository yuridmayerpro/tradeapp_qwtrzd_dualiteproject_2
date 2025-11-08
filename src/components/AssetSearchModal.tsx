import React, { useState, useMemo } from 'react';
import { X, Search, Star, ChevronRight } from 'lucide-react';
import { BinanceAsset } from '../types';

interface AssetSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (symbol: string) => void;
  allAssets: BinanceAsset[];
  featuredAssets: string[];
  selectedAsset: string;
}

const AssetSearchModal: React.FC<AssetSearchModalProps> = ({ isOpen, onClose, onSelectAsset, allAssets, featuredAssets, selectedAsset }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedAssets = useMemo(() => {
    return [...allAssets].sort((a, b) => {
      const aIsFeatured = featuredAssets.includes(a.appSymbol);
      const bIsFeatured = featuredAssets.includes(b.appSymbol);
      if (aIsFeatured && !bIsFeatured) return -1;
      if (!aIsFeatured && bIsFeatured) return 1;
      return a.baseAsset.localeCompare(b.baseAsset);
    });
  }, [allAssets, featuredAssets]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) {
      return sortedAssets;
    }
    return sortedAssets.filter(asset => 
      asset.appSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.baseAsset.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedAssets, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Pesquisar Ativo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors rounded-full p-1 hover:bg-slate-700">
            <X size={24} />
          </button>
        </header>
        <div className="p-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou símbolo (ex: BTC, Ethereum)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {!searchTerm && <h3 className="text-sm font-semibold text-slate-400 px-4 pb-2">Criptomoedas Principais</h3>}
          <ul>
            {filteredAssets.map(asset => (
              <li key={asset.symbol}>
                <button
                  onClick={() => onSelectAsset(asset.appSymbol)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors group ${
                    selectedAsset === asset.appSymbol ? 'bg-blue-600/20' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Star 
                      className={featuredAssets.includes(asset.appSymbol) ? 'text-yellow-400' : 'text-slate-600 group-hover:text-slate-400 transition-colors'} 
                      size={20} 
                      fill={featuredAssets.includes(asset.appSymbol) ? 'currentColor' : 'none'}
                    />
                    <div>
                      <p className={`font-bold ${selectedAsset === asset.appSymbol ? 'text-blue-300' : 'text-white'}`}>{asset.appSymbol}</p>
                      <p className="text-sm text-slate-400">{asset.baseAsset}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              </li>
            ))}
             {filteredAssets.length === 0 && (
                <div className="text-center py-10 px-4">
                    <p className="text-slate-400">Nenhum ativo encontrado.</p>
                    <p className="text-sm text-slate-500 mt-1">Tente um termo de busca diferente.</p>
                </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AssetSearchModal;
