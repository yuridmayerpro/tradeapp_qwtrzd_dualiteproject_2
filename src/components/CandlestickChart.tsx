import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CandleData, Signal, BinanceTrade } from '../types';

interface CandlestickChartProps {
  data: CandleData[];
  signals: Signal[];
  myTrades: BinanceTrade[];
  selectedAsset: string;
  timezone: string;
  timestamps: string[];
}

const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(2)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(2)}K`;
  return volume.toFixed(2);
};

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, signals, myTrades, selectedAsset, timezone, timestamps }) => {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const candleData = data.map(d => [d.open, d.close, d.low, d.high]);
    const volumes = data.map(d => d.volume);
    const candleInterval = 15 * 60 * 1000;

    const signalBuyPoints = signals.filter(s => s.type === 'BUY').map(s => {
      const index = data.findIndex(d => d.timestamp === s.timestamp);
      return index >= 0 ? { coord: [index, s.price], value: 'COMPRA' } : null;
    }).filter(Boolean);

    const signalSellPoints = signals.filter(s => s.type === 'SELL').map(s => {
      const index = data.findIndex(d => d.timestamp === s.timestamp);
      return index >= 0 ? { coord: [index, s.price], value: 'VENDA' } : null;
    }).filter(Boolean);

    const myTradePoints = myTrades.map(trade => {
      const tradeTime = trade.time;
      const index = data.findIndex(d => tradeTime >= d.timestamp && tradeTime < d.timestamp + candleInterval);
      if (index === -1) return null;

      const tradePrice = parseFloat(trade.price);
      const tradeQty = parseFloat(trade.qty);
      const tradeTotal = parseFloat(trade.quoteQty);

      return {
        coord: [index, tradePrice],
        value: trade.isBuyer ? 'Sua Compra' : 'Sua Venda',
        symbol: 'circle',
        symbolSize: 10,
        itemStyle: {
          color: trade.isBuyer ? '#38bdf8' : '#fb923c', // Light Blue for Buy, Orange for Sell
          borderColor: '#fff',
          borderWidth: 1,
        },
        tooltip: {
          formatter: () => `
            <div style="padding: 8px; font-size: 12px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: ${trade.isBuyer ? '#7dd3fc' : '#fcd34d'};">${trade.isBuyer ? 'Sua Compra' : 'Sua Venda'}</div>
              <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px;">
                <span>Preço:</span><span style="font-weight: bold;">$${tradePrice.toFixed(2)}</span>
                <span>Quantidade:</span><span>${tradeQty}</span>
                <span>Total:</span><span>$${tradeTotal.toFixed(2)}</span>
              </div>
            </div>
          `
        }
      };
    }).filter(Boolean);

    return {
      backgroundColor: 'transparent',
      animation: true,
      axisPointer: { link: [{ xAxisIndex: 'all' }], label: { backgroundColor: '#777' } },
      grid: [
        { left: '6%', right: '2%', top: '8%', height: '65%' },
        { left: '6%', right: '2%', top: '80%', height: '12%' }
      ],
      xAxis: [
        { type: 'category', data: timestamps, scale: true, boundaryGap: true, axisLine: { lineStyle: { color: '#475569' } }, axisLabel: { color: '#94a3b8', fontSize: 9 }, splitLine: { show: false }, min: 'dataMin', max: 'dataMax' },
        { type: 'category', gridIndex: 1, data: timestamps, scale: true, boundaryGap: true, axisLine: { onZero: false, lineStyle: { color: '#475569' } }, axisLabel: { show: false }, splitLine: { show: false }, axisTick: { show: false } }
      ],
      yAxis: [
        { scale: true, splitArea: { show: false }, axisLine: { lineStyle: { color: '#475569' } }, axisLabel: { color: '#94a3b8', fontSize: 9, formatter: (value: number) => `$${value.toFixed(2)}` }, splitLine: { lineStyle: { color: '#334155', type: 'dashed' } } },
        { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } }
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 50, end: 100 },
        { show: true, xAxisIndex: [0, 1], type: 'slider', bottom: '8%', start: 50, end: 100, borderColor: '#475569', fillerColor: 'rgba(71, 85, 105, 0.2)', handleStyle: { color: '#64748b' }, textStyle: { color: '#94a3b8' } }
      ],
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#475569', textStyle: { color: '#e2e8f0' }
      },
      series: [
        {
          name: selectedAsset, type: 'candlestick', data: candleData,
          itemStyle: { color: '#10b981', color0: '#ef4444', borderColor: '#10b981', borderColor0: '#ef4444' },
          tooltip: {
            formatter: (params: any) => {
              const candleParam = Array.isArray(params) ? params.find(p => p.seriesType === 'candlestick') : params;
              if (!candleParam) return '';
              const dataIndex = candleParam.dataIndex;
              const originalDataPoint = data[dataIndex];
              if (!originalDataPoint) return '';
              const { open, close, low, high, volume } = originalDataPoint;
              const timestampLabel = candleParam.axisValueLabel || candleParam.name;
              const formatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
              return `
                <div style="padding: 8px; font-size: 12px;">
                  <div style="font-weight: bold; margin-bottom: 8px;">${timestampLabel}</div>
                  <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px;">
                    <span>Abertura:</span><span style="color: #60a5fa;">$${open.toLocaleString('en-US', formatOptions)}</span>
                    <span>Fechamento:</span><span style="color: ${close >= open ? '#34d399' : '#f87171'};">$${close.toLocaleString('en-US', formatOptions)}</span>
                    <span>Mínima:</span><span style="color: #f87171;">$${low.toLocaleString('en-US', formatOptions)}</span>
                    <span>Máxima:</span><span style="color: #34d399;">$${high.toLocaleString('en-US', formatOptions)}</span>
                    <span>Volume:</span><span>${formatVolume(volume)}</span>
                  </div>
                </div>
              `;
            }
          },
          markPoint: {
            label: { formatter: '{b}', color: '#fff', fontSize: 11, fontWeight: 'bold' },
            data: [
              ...signalBuyPoints.map(s => ({ ...s, symbol: 'arrow', symbolSize: 20, symbolRotate: 180, itemStyle: { color: '#10b981' } })),
              ...signalSellPoints.map(s => ({ ...s, symbol: 'arrow', symbolSize: 20, itemStyle: { color: '#ef4444' } })),
              ...myTradePoints
            ]
          }
        },
        {
          name: 'Volume', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: volumes,
          itemStyle: {
            color: (params: any) => {
              const index = params.dataIndex;
              if (!candleData[index]) return 'rgba(100, 116, 139, 0.5)';
              return candleData[index][1] >= candleData[index][0] ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
            }
          }
        }
      ]
    };
  }, [data, signals, myTrades, selectedAsset, timestamps]);

  return (
    <div className="p-4 pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold text-white">Gráfico de Candlestick - {selectedAsset} <span className="text-base font-medium text-slate-400">(15m)</span></h2>
        <div className="flex items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm"></div><span>Sinal de Compra</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div><span>Sinal de Venda</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#38bdf8] rounded-full"></div><span>Sua Compra</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#fb923c] rounded-full"></div><span>Sua Venda</span></div>
        </div>
      </div>
      {data && data.length > 0 ? (
        <div className="h-[450px] md:h-[600px]">
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            opts={{ renderer: 'svg' }} 
            notMerge={true} 
            lazyUpdate={true}
            group="cryptoCharts"
          />
        </div>
      ) : (
        <div style={{ height: '600px', width: '100%' }} className="flex items-center justify-center">
            <p className="text-slate-400">Nenhum dado de gráfico disponível para o dia atual.</p>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;
