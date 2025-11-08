import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface ComparativeIndicatorChartProps {
  timestamps: string[];
  adxHistory: number[];
  gogHistory: number[];
  slopeHistory: number[];
}

// Normaliza uma série de dados para o intervalo [0, 1] para comparação visual
const normalizeData = (data: number[]): number[] => {
    const validData = data.filter(v => !isNaN(v) && isFinite(v));
    if (validData.length < 2) return data.map(() => 0.5);
    
    const min = Math.min(...validData);
    const max = Math.max(...validData);

    if (max === min) return data.map(v => (isNaN(v) || !isFinite(v)) ? NaN : 0.5);

    return data.map(v => (isNaN(v) || !isFinite(v)) ? NaN : (v - min) / (max - min));
};

const ComparativeIndicatorChart: React.FC<ComparativeIndicatorChartProps> = ({ 
  timestamps,
  adxHistory, 
  gogHistory, 
  slopeHistory 
}) => {

  const chartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      animation: false, // Desativar animação para sincronização mais suave
      grid: { left: '6%', right: '2%', top: '25%', bottom: '20%' },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', link: [{ xAxisIndex: 'all' }] },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any[]) => {
          const pointIndex = params[0]?.dataIndex;
          if (typeof pointIndex === 'undefined') return '';
          
          let tooltipHtml = `<div style="padding: 8px; font-size: 11px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValueLabel}</div>`;
          params.forEach(param => {
            const seriesName = param.seriesName;
            const color = param.color;
            let originalValue;
            
            if (seriesName === 'ADX') originalValue = adxHistory[pointIndex];
            else if (seriesName === 'GOG') originalValue = gogHistory[pointIndex];
            else if (seriesName === 'Slope') originalValue = slopeHistory[pointIndex];

            if (typeof originalValue !== 'undefined' && !isNaN(originalValue)) {
              tooltipHtml += `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></span>
                  <span>${seriesName}:</span>
                  <span style="font-weight: bold;">${originalValue.toFixed(4)}</span>
                </div>
              `;
            }
          });
          tooltipHtml += `</div>`;
          return tooltipHtml;
        }
      },
      legend: {
        data: ['ADX', 'GOG', 'Slope'],
        top: 10,
        right: 20,
        textStyle: { color: '#94a3b8', fontSize: 11 },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
      },
      xAxis: { 
        type: 'category', 
        data: timestamps,
        boundaryGap: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: { 
        type: 'value', 
        scale: true,
        axisLabel: { show: false },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
      },
      series: [
        {
          name: 'ADX', type: 'line', data: normalizeData(adxHistory),
          smooth: true, showSymbol: false, color: '#60a5fa',
          lineStyle: { width: 2 }
        },
        {
          name: 'GOG', type: 'line', data: normalizeData(gogHistory),
          smooth: true, showSymbol: false, color: '#a78bfa',
          lineStyle: { width: 2 }
        },
        {
          name: 'Slope', type: 'line', data: normalizeData(slopeHistory),
          smooth: true, showSymbol: false, color: '#34d399',
          lineStyle: { width: 2 }
        }
      ]
    };
  }, [timestamps, adxHistory, gogHistory, slopeHistory]);

  return (
    <div className="border-t border-slate-700/50">
      <div className="px-4 pt-4">
        <h3 className="text-base font-bold text-white">Análise Comparativa de Indicadores</h3>
      </div>
      <div className="h-[150px] md:h-[180px]">
        <ReactECharts
          option={chartOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={true}
          group="cryptoCharts"
        />
      </div>
    </div>
  );
};

export default ComparativeIndicatorChart;
