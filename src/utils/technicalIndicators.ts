import { CandleData, IndicatorParams, Signal, FullCandleData } from '../types';

// ===============================================================
// Helpers matemáticos robustos (aderente ao Pandas EWM)
// ===============================================================

/**
 * Calcula a Média Móvel Exponencial (EMA) de uma série.
 * Comportamento similar ao pandas.ewm(span=period, adjust=False).
 */
const ema = (series: number[], period: number): number[] => {
    const result: number[] = Array(series.length).fill(NaN);
    if (series.length === 0) return result;

    const alpha = 2 / (period + 1);
    let firstValidIndex = series.findIndex(v => !isNaN(v));

    if (firstValidIndex === -1) return result; // Retorna array de NaNs se não houver dados válidos

    result[firstValidIndex] = series[firstValidIndex];

    for (let i = firstValidIndex + 1; i < series.length; i++) {
        const currentValue = series[i];
        const prevEma = result[i - 1];

        if (isNaN(currentValue)) {
            result[i] = prevEma;
        } else {
            result[i] = alpha * currentValue + (1 - alpha) * prevEma;
        }
    }
    return result;
};


/**
 * Calcula a Média Móvel de Wilder (Wilder's Smoothing).
 * Equivalente a um EMA com alpha = 1 / period.
 */
const wilderEma = (series: number[], period: number): number[] => {
    const result: number[] = Array(series.length).fill(NaN);
    if (series.length === 0) return result;

    let firstValidIndex = series.findIndex(v => !isNaN(v));

    if (firstValidIndex === -1) return result; // Retorna array de NaNs se não houver dados válidos

    result[firstValidIndex] = series[firstValidIndex];

    for (let i = firstValidIndex + 1; i < series.length; i++) {
        const currentValue = series[i];
        const prevEma = result[i - 1];

        if (isNaN(currentValue)) {
            result[i] = prevEma;
        } else {
            result[i] = (prevEma * (period - 1) + currentValue) / period;
        }
    }
    return result;
};


// ===============================================================
// Indicadores: ADX, Slope, GOG (aderente à referência)
// ===============================================================

const calculateADX = (candles: CandleData[], period: number): number[] => {
  if (candles.length < period * 2) return Array(candles.length).fill(NaN);

  const trs: number[] = [NaN];
  const plusDMs: number[] = [NaN];
  const minusDMs: number[] = [NaN];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;

    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDMs.push((upMove > downMove && upMove > 0) ? upMove : 0);
    minusDMs.push((downMove > upMove && downMove > 0) ? downMove : 0);
  }

  const smoothedTRs = wilderEma(trs, period);
  const smoothedPlusDMs = wilderEma(plusDMs, period);
  const smoothedMinusDMs = wilderEma(minusDMs, period);

  const plusDIs: number[] = Array(candles.length).fill(NaN);
  const minusDIs: number[] = Array(candles.length).fill(NaN);
  const dxs: number[] = Array(candles.length).fill(NaN);

  for (let i = period; i < candles.length; i++) {
    const sTR = smoothedTRs[i];
    if (sTR > 0) {
      const plusDI = (smoothedPlusDMs[i] / sTR) * 100;
      const minusDI = (smoothedMinusDMs[i] / sTR) * 100;
      plusDIs[i] = plusDI;
      minusDIs[i] = minusDI;

      const diSum = plusDI + minusDI;
      if (diSum > 0) {
        dxs[i] = (Math.abs(plusDI - minusDI) / diSum) * 100;
      }
    }
  }

  return wilderEma(dxs, period);
};

const calculateSlope = (candles: CandleData[], window: number, smoothSpan: number): number[] => {
  if (candles.length < window) return Array(candles.length).fill(NaN);

  const closePrices = candles.map(c => c.close);
  const rawSlopes: number[] = Array(candles.length).fill(NaN);
  
  const x = Array.from({ length: window }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const n = window;
  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) return rawSlopes;

  for (let i = window - 1; i < closePrices.length; i++) {
    const windowY = closePrices.slice(i - window + 1, i + 1);
    if (windowY.some(v => isNaN(v))) continue;
    
    const sumY = windowY.reduce((a, b) => a + b, 0);
    const sumXY = windowY.reduce((acc, y, j) => acc + y * x[j], 0);
    rawSlopes[i] = (n * sumXY - sumX * sumY) / denominator;
  }
  
  if (smoothSpan > 1) {
    return ema(rawSlopes, smoothSpan);
  }
  return rawSlopes;
};

const calculateGOG = (slopes: number[], accelSpan: number): number[] => {
  if (slopes.length < 2) return Array(slopes.length).fill(NaN);
  
  const slopeDiffs: number[] = [NaN];
  for (let i = 1; i < slopes.length; i++) {
    const diff = slopes[i] - slopes[i-1];
    slopeDiffs.push(isNaN(diff) ? NaN : diff);
  }
  
  return ema(slopeDiffs, accelSpan);
};

// ===============================================================
// Swings & Fibonacci
// ===============================================================

const detectSwings = (candles: CandleData[], left: number, right: number): { isSwingHigh: boolean[], isSwingLow: boolean[] } => {
  const n = candles.length;
  const isSwingHigh = Array(n).fill(false);
  const isSwingLow = Array(n).fill(false);

  for (let i = left; i < n - right; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= left; j++) {
      if (candles[i - j].high > high) isHigh = false;
      if (candles[i - j].low < low) isLow = false;
    }
    for (let j = 1; j <= right; j++) {
      if (candles[i + j].high > high) isHigh = false;
      if (candles[i + j].low < low) isLow = false;
    }
    if(isHigh) isSwingHigh[i] = true;
    if(isLow) isSwingLow[i] = true;
  }
  return { isSwingHigh, isSwingLow };
};

const fiboLevels = (swingLow: number, swingHigh: number, retrLow: number, retrHigh: number): any => {
    if (isNaN(swingLow) || isNaN(swingHigh) || swingHigh <= swingLow) return null;
    const move = swingHigh - swingLow;
    return {
        retr_upper_bound: swingHigh - retrLow * move,
        retr_lower_bound: swingHigh - retrHigh * move,
        x_127_2: swingHigh + 0.272 * move,
        x_161_8: swingHigh + 0.618 * move,
        x_200_0: swingHigh + 1.000 * move,
    };
};

const fiboLevelsDown = (swingHigh: number, swingLow: number, retrLow: number, retrHigh: number): any => {
    if (isNaN(swingLow) || isNaN(swingHigh) || swingHigh <= swingLow) return null;
    const move = swingHigh - swingLow;
    return {
        retr_lower_bound: swingLow + retrLow * move,
        retr_upper_bound: swingLow + retrHigh * move,
        x_127_2: swingLow - 0.272 * move,
        x_161_8: swingLow - 0.618 * move,
        x_200_0: swingLow - 1.000 * move,
    };
};

// ===============================================================
// Lógica de Sinal Principal
// ===============================================================

export const generateSignalsAndIndicators = (
  candles: CandleData[],
  params: IndicatorParams
): { fullData: FullCandleData[], signals: Signal[] } => {
  if (candles.length === 0) return { fullData: [], signals: [] };

  const adxValues = calculateADX(candles, params.adxPeriod);
  const slopeValues = calculateSlope(candles, params.slopeWindow, params.slopeSmooth);
  const gogValues = calculateGOG(slopeValues, params.gogSpan);
  const { isSwingHigh, isSwingLow } = detectSwings(candles, params.swingLeft, params.swingRight);

  const fullData: FullCandleData[] = candles.map((c, i) => {
    const adx = adxValues[i];
    const slope = slopeValues[i];
    const gog = gogValues[i];

    return {
      ...c,
      adx: Number.isFinite(adx) ? adx : NaN,
      slope: Number.isFinite(slope) ? slope : NaN,
      gog: Number.isFinite(gog) ? gog : NaN,
      isSwingHigh: isSwingHigh[i],
      isSwingLow: isSwingLow[i]
    };
  });

  const signals: Signal[] = [];
  let lastSwingHighPrice = NaN;
  let lastSwingLowPrice = NaN;
  let prevGog = NaN;

  for (let i = 0; i < fullData.length; i++) {
    const row = fullData[i];

    if (row.isSwingHigh) lastSwingHighPrice = row.high;
    if (row.isSwingLow) lastSwingLowPrice = row.low;

    if (isNaN(row.adx) || row.adx < params.adxThreshold || isNaN(lastSwingHighPrice) || isNaN(lastSwingLowPrice)) {
      prevGog = row.gog;
      continue;
    }

    const price = row.close;
    const isUptrend = row.slope > 0;
    const isDowntrend = row.slope < 0;

    // --- Gatilho de COMPRA ---
    if (isUptrend && lastSwingHighPrice > lastSwingLowPrice) {
      const fib = fiboLevels(lastSwingLowPrice, lastSwingHighPrice, params.fiboRetrLow, params.fiboRetrHigh);
      if (fib) {
        const inZone = price >= fib.retr_lower_bound && price <= fib.retr_upper_bound;
        const gogCrossUp = !isNaN(prevGog) && prevGog <= 0 && row.gog > 0;
        const gogRising = !isNaN(prevGog) && row.gog > prevGog;

        if (inZone && (gogCrossUp || gogRising)) {
          const buyReason = `<b>Justificativa:</b><br>• Zona de suporte Fibonacci<br>• Slope positivo (tendência de alta)<br>• GOG crescente (aceleração positiva)<br>• ADX acima do limiar (${row.adx.toFixed(2)})<br>• Impulso de alta recente`;
          signals.push({
            timestamp: row.timestamp, type: 'BUY', price,
            reason: buyReason,
            sl: Math.max(fib.retr_lower_bound, lastSwingLowPrice),
            tp1: fib.x_127_2, tp2: fib.x_161_8, tp3: fib.x_200_0,
          });
        }
      }
    }

    // --- Gatilho de VENDA ---
    if (isDowntrend && lastSwingLowPrice < lastSwingHighPrice) {
      const fib = fiboLevelsDown(lastSwingHighPrice, lastSwingLowPrice, params.fiboRetrLow, params.fiboRetrHigh);
      if (fib) {
        const inZone = price <= fib.retr_upper_bound && price >= fib.retr_lower_bound;
        const gogCrossDown = !isNaN(prevGog) && prevGog >= 0 && row.gog < 0;
        const gogFalling = !isNaN(prevGog) && row.gog < prevGog;

        if (inZone && (gogCrossDown || gogFalling)) {
          const sellReason = `<b>Justificativa:</b><br>• Zona de resistência Fibonacci<br>• Slope negativo (tendência de baixa)<br>• GOG decrescente (aceleração negativa)<br>• ADX acima do limiar (${row.adx.toFixed(2)})<br>• Impulso de baixa recente`;
          signals.push({
            timestamp: row.timestamp, type: 'SELL', price,
            reason: sellReason,
            sl: Math.min(fib.retr_upper_bound, lastSwingHighPrice),
            tp1: fib.x_127_2, tp2: fib.x_161_8, tp3: fib.x_200_0,
          });
        }
      }
    }

    prevGog = row.gog;
  }

  return { fullData, signals };
};
