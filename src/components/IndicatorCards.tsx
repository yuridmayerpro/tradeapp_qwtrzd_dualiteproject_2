import React from 'react';
import { IndicatorData } from '../types';
import { Activity, TrendingUp, LineChart } from 'lucide-react';

interface IndicatorCardsProps {
  indicators: IndicatorData;
}

const IndicatorCards: React.FC<IndicatorCardsProps> = ({ indicators }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl border border-blue-500/30 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-blue-200">ADX</h3>
            </div>
          </div>
          <span className="text-4xl font-bold text-white">{indicators.adx.toFixed(2)}</span>
        </div>
        <div className="mt-3 text-xs text-blue-300">
          {indicators.adx > 25 ? 'Tendência Forte' : indicators.adx > 20 ? 'Tendência Moderada' : 'Tendência Fraca'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl border border-purple-500/30 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-purple-200">GOG</h3>
            </div>
          </div>
          <span className="text-4xl font-bold text-white">{indicators.gog.toFixed(4)}</span>
        </div>
        <div className="mt-3 text-xs text-purple-300">
          {indicators.gog > 0 ? 'Acelerando Alta' : 'Acelerando Baixa'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl border border-emerald-500/30 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-200">Slope</h3>
            </div>
          </div>
          <span className="text-4xl font-bold text-white">{indicators.slope.toFixed(4)}</span>
        </div>
        <div className="mt-3 text-xs text-emerald-300">
          {indicators.slope > 0 ? 'Tendência de Alta' : 'Tendência de Baixa'}
        </div>
      </div>
    </div>
  );
};

export default IndicatorCards;
