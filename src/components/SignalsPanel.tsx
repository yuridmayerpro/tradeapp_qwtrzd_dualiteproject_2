import React from 'react';
import { Signal } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Target, ShieldAlert, Clock } from 'lucide-react';

interface SignalsPanelProps {
  signals: Signal[];
  timezone: string;
}

const SignalsPanel: React.FC<SignalsPanelProps> = ({ signals, timezone }) => {
  const displayedSignals = signals.slice(0, 5);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Sinais de Trading Recentes</h2>
      </div>

      {displayedSignals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Nenhum sinal detectado no momento</p>
          <p className="text-sm text-slate-500 mt-2">Aguardando condições técnicas ideais para gerar sinais...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedSignals.map((signal, index) => (
            <div
              key={`${signal.timestamp}-${index}`}
              className={`p-4 rounded-lg border ${
                signal.type === 'BUY'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {signal.type === 'BUY' ? (
                  <ArrowUpCircle className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                ) : (
                  <ArrowDownCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className={`font-bold text-lg ${
                      signal.type === 'BUY' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {signal.type === 'BUY' ? 'SINAL DE COMPRA' : 'SINAL DE VENDA'} @ ${signal.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(signal.timestamp).toLocaleTimeString('pt-BR', { timeZone: timezone })}
                    </span>
                  </div>
                  <div 
                    className="text-sm text-slate-300 mb-4 leading-relaxed" 
                    dangerouslySetInnerHTML={{ __html: signal.reason }} 
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-md">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <div>
                        <div className="text-slate-400 text-xs">Stop Loss</div>
                        <div className="font-semibold text-white">${signal.sl.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-md">
                      <Target className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-slate-400 text-xs">Alvo 1</div>
                        <div className="font-semibold text-white">${signal.tp1.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-md">
                      <Target className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-slate-400 text-xs">Alvo 2</div>
                        <div className="font-semibold text-white">${signal.tp2.toFixed(2)}</div>
                      </div>
                    </div>
                     <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-md">
                      <Target className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-slate-400 text-xs">Alvo 3</div>
                        <div className="font-semibold text-white">${signal.tp3.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignalsPanel;
