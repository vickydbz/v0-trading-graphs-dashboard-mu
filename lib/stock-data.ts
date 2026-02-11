export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Emitent {
  symbol: string;
  name: string;
  sector: string;
}

export const EMITENTS: Emitent[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Finance" },
  { symbol: "V", name: "Visa Inc.", sector: "Finance" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy" },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateOHLCData(
  symbol: string,
  days: number = 365
): OHLCData[] {
  const symbolSeed =
    symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 1000;
  const rng = seededRandom(symbolSeed);

  const basePrices: Record<string, number> = {
    AAPL: 178,
    MSFT: 375,
    GOOGL: 140,
    AMZN: 155,
    TSLA: 245,
    NVDA: 495,
    META: 360,
    JPM: 170,
    V: 265,
    JNJ: 160,
    WMT: 165,
    XOM: 105,
  };

  const base = basePrices[symbol] || 100;
  const data: OHLCData[] = [];
  let price = base;

  const startDate = new Date("2025-02-01");

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = 0.015 + rng() * 0.02;
    const drift = (rng() - 0.48) * volatility;
    const change = price * drift;

    const open = price + change * rng();
    const close = price + change;
    const high = Math.max(open, close) * (1 + rng() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - rng() * volatility * 0.5);
    const volume = Math.floor(10000000 + rng() * 50000000);

    data.push({
      time: date.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return data;
}

// Technical indicator calculations
export function calculateSMA(data: OHLCData[], period: number) {
  const result: { time: string; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, d) => acc + d.close, 0);
    result.push({ time: data[i].time, value: parseFloat((sum / period).toFixed(2)) });
  }
  return result;
}

export function calculateEMA(data: OHLCData[], period: number) {
  const result: { time: string; value: number }[] = [];
  const multiplier = 2 / (period + 1);

  let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;
  result.push({ time: data[period - 1].time, value: parseFloat(ema.toFixed(2)) });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({ time: data[i].time, value: parseFloat(ema.toFixed(2)) });
  }
  return result;
}

export function calculateMACD(data: OHLCData[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  const macdLine: { time: string; value: number }[] = [];
  const ema26Map = new Map(ema26.map((d) => [d.time, d.value]));

  for (const d of ema12) {
    const ema26Val = ema26Map.get(d.time);
    if (ema26Val !== undefined) {
      macdLine.push({
        time: d.time,
        value: parseFloat((d.value - ema26Val).toFixed(4)),
      });
    }
  }

  // Signal line (9-period EMA of MACD)
  const signalPeriod = 9;
  const signalLine: { time: string; value: number }[] = [];
  if (macdLine.length >= signalPeriod) {
    const multiplier = 2 / (signalPeriod + 1);
    let ema =
      macdLine.slice(0, signalPeriod).reduce((acc, d) => acc + d.value, 0) /
      signalPeriod;
    signalLine.push({
      time: macdLine[signalPeriod - 1].time,
      value: parseFloat(ema.toFixed(4)),
    });

    for (let i = signalPeriod; i < macdLine.length; i++) {
      ema = (macdLine[i].value - ema) * multiplier + ema;
      signalLine.push({
        time: macdLine[i].time,
        value: parseFloat(ema.toFixed(4)),
      });
    }
  }

  // Histogram
  const signalMap = new Map(signalLine.map((d) => [d.time, d.value]));
  const histogram: { time: string; value: number; color: string }[] = [];
  for (const d of macdLine) {
    const signal = signalMap.get(d.time);
    if (signal !== undefined) {
      const val = parseFloat((d.value - signal).toFixed(4));
      histogram.push({
        time: d.time,
        value: val,
        color: val >= 0 ? "rgba(38, 166, 91, 0.6)" : "rgba(239, 83, 80, 0.6)",
      });
    }
  }

  return { macdLine, signalLine, histogram };
}

export function calculateRSI(data: OHLCData[], period: number = 14) {
  const result: { time: string; value: number }[] = [];
  const changes = data.map((d, i) =>
    i === 0 ? 0 : d.close - data[i - 1].close
  );

  let avgGain =
    changes
      .slice(1, period + 1)
      .filter((c) => c > 0)
      .reduce((a, b) => a + b, 0) / period;
  let avgLoss =
    Math.abs(
      changes
        .slice(1, period + 1)
        .filter((c) => c < 0)
        .reduce((a, b) => a + b, 0)
    ) / period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({
    time: data[period].time,
    value: parseFloat((100 - 100 / (1 + rs)).toFixed(2)),
  });

  for (let i = period + 1; i < data.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const currentRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({
      time: data[i].time,
      value: parseFloat((100 - 100 / (1 + currentRs)).toFixed(2)),
    });
  }

  return result;
}

export function calculateStochastic(
  data: OHLCData[],
  kPeriod: number = 14,
  dPeriod: number = 3
) {
  const kLine: { time: string; value: number }[] = [];

  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map((d) => d.high));
    const low = Math.min(...slice.map((d) => d.low));
    const k = high === low ? 50 : ((data[i].close - low) / (high - low)) * 100;
    kLine.push({ time: data[i].time, value: parseFloat(k.toFixed(2)) });
  }

  const dLine: { time: string; value: number }[] = [];
  for (let i = dPeriod - 1; i < kLine.length; i++) {
    const avg =
      kLine.slice(i - dPeriod + 1, i + 1).reduce((a, d) => a + d.value, 0) /
      dPeriod;
    dLine.push({ time: kLine[i].time, value: parseFloat(avg.toFixed(2)) });
  }

  return { kLine, dLine };
}

export function calculateBollingerBands(
  data: OHLCData[],
  period: number = 20,
  stdDev: number = 2
) {
  const sma = calculateSMA(data, period);
  const upper: { time: string; value: number }[] = [];
  const lower: { time: string; value: number }[] = [];

  for (let i = 0; i < sma.length; i++) {
    const dataIndex = i + period - 1;
    const slice = data.slice(dataIndex - period + 1, dataIndex + 1);
    const mean = sma[i].value;
    const variance =
      slice.reduce((acc, d) => acc + (d.close - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);

    upper.push({
      time: sma[i].time,
      value: parseFloat((mean + stdDev * sd).toFixed(2)),
    });
    lower.push({
      time: sma[i].time,
      value: parseFloat((mean - stdDev * sd).toFixed(2)),
    });
  }

  return { middle: sma, upper, lower };
}
