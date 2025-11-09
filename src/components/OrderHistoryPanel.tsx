import React, { useState } from 'react';
import { BinanceOrder, BinanceTrade } from '../types';
import { History, ShoppingCart, ArrowRight, LoaderCircle, AlertTriangle, Info } from 'lucide-react';

interface OrderHistoryPanelProps {
  openOrders: BinanceOrder[];
  tradeHistory: BinanceTrade[];
  isLoading: boolean;
  error: Error | null;
  timezone: string;
}

const OrderStatusBadge: React.FC<{ status: BinanceOrder['status'] }> = ({ status }) => {
  const statusMap = {
    NEW: 'bg-blue-500/20 text-blue-300',
    PARTIALLY_FILLED: 'bg-yellow-500/20 text-yellow-300',
    FILLED: 'bg-green-500/20 text-green-300',
    CANCELED: 'bg-slate-500/20 text-slate-400',
    REJECTED: 'bg-red-500/20 text-red-300',
    EXPIRED: 'bg-purple-500/20 text-purple-300',
    PENDING_CANCEL: 'bg-orange-500/20 text-orange-300',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusMap[status] || 'bg-slate-500/20 text-slate-400'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const OrderHistoryPanel: React.FC<OrderHistoryPanelProps> = ({ openOrders, tradeHistory, isLoading, error, timezone }) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const renderLoading = () => (
    <div className="p-6 text-center">
      <LoaderCircle className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
      <p className="mt-2 text-slate-400">Buscando seu histórico de atividades...</p>
    </div>
  );

  const renderError = () => (
    <div className="p-6 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
      <p className="text-red-300 font-semibold mb-2">Falha ao buscar atividades</p>
      <p className="text-sm text-slate-400">{error?.message || 'Ocorreu um erro desconhecido.'}</p>
    </div>
  );
  
  const renderOpenOrders = () => (
    <div className="space-y-3">
      {openOrders.length === 0 ? (
        <div className="text-center py-10">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">Nenhuma ordem em aberto para este ativo.</p>
        </div>
      ) : (
        openOrders.map(order => (
          <div key={order.orderId} className="bg-slate-800/70 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {order.side}
                </span>
                <span className="text-white font-semibold">{order.symbol}</span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Preço</p>
                <p className="font-mono text-white">${parseFloat(order.price).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Quantidade</p>
                <p className="font-mono text-white">{parseFloat(order.origQty)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Executado</p>
                <p className="font-mono text-white">{parseFloat(order.executedQty)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Data</p>
                <p className="text-white">{new Date(order.time).toLocaleString('pt-BR', { timeZone: timezone, dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderTradeHistory = () => (
     <div className="space-y-3">
      {tradeHistory.length === 0 ? (
        <div className="text-center py-10">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">Nenhum trade executado nas últimas 48h para este ativo.</p>
        </div>
      ) : (
        tradeHistory.map(trade => (
          <div key={trade.id} className="bg-slate-800/70 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${trade.isBuyer ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.isBuyer ? 'COMPRA' : 'VENDA'}
                </span>
                <span className="text-white font-semibold">{trade.symbol}</span>
              </div>
               <span className="text-sm text-slate-400">{new Date(trade.time).toLocaleString('pt-BR', { timeZone: timezone, dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Preço Executado</p>
                <p className="font-mono text-white">${parseFloat(trade.price).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Quantidade</p>
                <p className="font-mono text-white">{parseFloat(trade.qty)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Valor Total</p>
                <p className="font-mono text-white">${parseFloat(trade.quoteQty).toFixed(2)}</p>
              </div>
               <div>
                <p className="text-slate-400 text-xs">Taxa</p>
                <p className="font-mono text-white">{parseFloat(trade.commission)} {trade.commissionAsset}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <details className="bg-slate-800/50 rounded-xl border border-slate-700 open:pb-6 transition-all group">
      <summary className="p-6 cursor-pointer flex items-center justify-between list-none">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">Minhas Atividades na Binance</h2>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <LoaderCircle className="w-5 h-5 text-slate-400 animate-spin" />}
          <span className="text-sm text-slate-400 hidden md:block">Ordens e Trades (48h)</span>
        </div>
      </summary>
      
      <div className="px-6">
        <div className="border-b border-slate-700 mb-4">
          <nav className="flex gap-4 -mb-px">
            <button 
              onClick={() => setActiveTab('open')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'open' ? 'border-orange-400 text-orange-300' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <ShoppingCart size={16} /> Ordens em Aberto
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'history' ? 'border-orange-400 text-orange-300' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <ArrowRight size={16} /> Histórico de Trades
            </button>
          </nav>
        </div>
        
        {isLoading ? renderLoading() : error ? renderError() : (
          activeTab === 'open' ? renderOpenOrders() : renderTradeHistory()
        )}
      </div>
    </details>
  );
};

export default OrderHistoryPanel;
