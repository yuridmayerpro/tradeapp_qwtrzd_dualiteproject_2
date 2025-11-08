import React from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { IndicatorParams } from '../types';

interface ParametersPanelProps {
  params: IndicatorParams;
  onParamsChange: (params: IndicatorParams) => void;
}

const ParameterInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, min = 1, max = 100, step = 1 }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-300">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const val = e.target.type === 'number' ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        onChange(isNaN(val) ? 0 : val);
      }}
      min={min}
      max={max}
      step={step}
      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const ParametersPanel: React.FC<ParametersPanelProps> = ({ params, onParamsChange }) => {
  const handleChange = (field: keyof IndicatorParams, value: number) => {
    onParamsChange({ ...params, [field]: value });
  };

  return (
    <details className="bg-slate-800/50 rounded-xl border border-slate-700 open:pb-6 transition-all group">
      <summary className="p-6 cursor-pointer flex items-center justify-between list-none">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Parâmetros de Análise</h2>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-300 transform group-open:rotate-180" />
      </summary>
      
      <div className="px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            <ParameterInput
            label="Período ADX"
            value={params.adxPeriod}
            onChange={(v) => handleChange('adxPeriod', v)}
            min={5} max={50}
            />
            <ParameterInput
            label="Limite ADX"
            value={params.adxThreshold}
            onChange={(v) => handleChange('adxThreshold', v)}
            min={10} max={40}
            />
            <ParameterInput
            label="Janela Slope"
            value={params.slopeWindow}
            onChange={(v) => handleChange('slopeWindow', v)}
            min={5} max={50}
            />
            <ParameterInput
            label="Suavização Slope"
            value={params.slopeSmooth}
            onChange={(v) => handleChange('slopeSmooth', v)}
            min={1} max={20}
            />
            <ParameterInput
            label="Período GOG"
            value={params.gogSpan}
            onChange={(v) => handleChange('gogSpan', v)}
            min={1} max={20}
            />
            <ParameterInput
            label="Pivô Esquerda"
            value={params.swingLeft}
            onChange={(v) => handleChange('swingLeft', v)}
            min={1} max={10}
            />
            <ParameterInput
            label="Pivô Direita"
            value={params.swingRight}
            onChange={(v) => handleChange('swingRight', v)}
            min={1} max={10}
            />
            <ParameterInput
            label="Fibo Retr. Baixa"
            value={params.fiboRetrLow}
            onChange={(v) => handleChange('fiboRetrLow', v)}
            min={0} max={1} step={0.001}
            />
            <ParameterInput
            label="Fibo Retr. Alta"
            value={params.fiboRetrHigh}
            onChange={(v) => handleChange('fiboRetrHigh', v)}
            min={0} max={1} step={0.001}
            />
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200">
            <strong>Dica:</strong> Sinais são gerados quando o preço está em uma zona de retração de Fibonacci e o GOG (aceleração) confirma a reversão da correção. O ADX filtra mercados sem tendência.
            </p>
        </div>
      </div>
    </details>
  );
};

export default ParametersPanel;
