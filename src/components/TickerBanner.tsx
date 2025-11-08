import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Asset } from '../types';

interface TickerBannerProps {
  assets: Asset[];
}

const TickerItem: React.FC<{ asset: Asset }> = ({ asset }) => (
  <div className="flex items-center gap-3 min-w-[220px] px-4 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
    <div className="flex flex-col flex-shrink-0">
      <span className="text-white font-semibold text-sm">{asset.symbol}</span>
      <span className="text-slate-400 text-xs truncate max-w-[120px]">{asset.name}</span>
    </div>
    <div className="flex flex-col items-end flex-grow">
      <span className="text-white font-bold text-sm">
        {asset.price > 0 ? `$${asset.price.toFixed(2)}` : '...'}
      </span>
      <div className={`flex items-center gap-1 text-xs font-medium ${
        asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
      }`}>
        {asset.price > 0 ? (
          asset.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
        ) : null}
        <span>{asset.price > 0 ? `${asset.changePercent >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%` : '...'}</span>
      </div>
    </div>
  </div>
);

const TickerBanner: React.FC<TickerBannerProps> = ({ assets }) => {
  const itemsToRender = assets.length > 0 ? assets : Array(10).fill({ symbol: 'CARREGANDO...', price: 0, changePercent: 0, name: '...' });
  const duplicatedItems = [...itemsToRender, ...itemsToRender];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 overflow-hidden py-3">
      <motion.div
        className="flex gap-8"
        animate={{ x: '-100%' }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 120,
            ease: 'linear'
          }
        }}
        style={{ width: `${duplicatedItems.length * 244}px` }}
      >
        {duplicatedItems.map((asset, index) => (
          <TickerItem key={`${asset.symbol}-${index}`} asset={asset} />
        ))}
      </motion.div>
    </div>
  );
};

export default TickerBanner;
