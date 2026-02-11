"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  type IChartApi,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import type { OHLCData } from "@/lib/stock-data";
import {
  calculateSMA,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateStochastic,
  calculateBollingerBands,
} from "@/lib/stock-data";

export type ChartType = "candlestick" | "line";
export type Indicator =
  | "sma"
  | "ema"
  | "macd"
  | "rsi"
  | "stochastic"
  | "bollinger"
  | "volume";

interface TradingChartProps {
  data: OHLCData[];
  chartType: ChartType;
  indicators: Indicator[];
  symbol: string;
  currency?: string;
  livePrice?: number | null;
  previousClose?: number | null;
}

export function TradingChart({
  data,
  chartType,
  indicators,
  symbol,
  currency = "USD",
  livePrice,
  previousClose,
}: TradingChartProps) {
  const mainChartRef = useRef<HTMLDivElement>(null);
  const indicatorChartRef = useRef<HTMLDivElement>(null);
  const mainChartApiRef = useRef<IChartApi | null>(null);
  const indicatorChartApiRef = useRef<IChartApi | null>(null);

  const hasSubChart =
    indicators.includes("macd") ||
    indicators.includes("rsi") ||
    indicators.includes("stochastic");

  const buildChart = useCallback(() => {
    if (!mainChartRef.current) return;

    // Cleanup
    if (mainChartApiRef.current) {
      mainChartApiRef.current.remove();
      mainChartApiRef.current = null;
    }
    if (indicatorChartApiRef.current) {
      indicatorChartApiRef.current.remove();
      indicatorChartApiRef.current = null;
    }

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 12,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.5)" },
        horzLines: { color: "rgba(42, 46, 57, 0.5)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(59, 130, 246, 0.4)", width: 1 as const, style: 2 as const },
        horzLine: { color: "rgba(59, 130, 246, 0.4)", width: 1 as const, style: 2 as const },
      },
      timeScale: {
        borderColor: "rgba(42, 46, 57, 0.8)",
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(42, 46, 57, 0.8)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      handleScroll: { vertTouchDrag: false },
    };

    // Main chart
    const mainHeight = hasSubChart ? 420 : 560;
    const mainChart = createChart(mainChartRef.current, {
      ...chartOptions,
      width: mainChartRef.current.clientWidth,
      height: mainHeight,
    });
    mainChartApiRef.current = mainChart;

    // Price series
    if (chartType === "candlestick") {
      const candleSeries = mainChart.addCandlestickSeries({
        upColor: "#26a65b",
        downColor: "#ef5350",
        borderUpColor: "#26a65b",
        borderDownColor: "#ef5350",
        wickUpColor: "#26a65b",
        wickDownColor: "#ef5350",
      });
      candleSeries.setData(
        data.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    } else {
      const lineSeries = mainChart.addLineSeries({
        color: "#3b82f6",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      lineSeries.setData(
        data.map((d) => ({ time: d.time, value: d.close }))
      );
    }

    // Volume overlay
    if (indicators.includes("volume")) {
      const volumeSeries = mainChart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        data.map((d) => ({
          time: d.time,
          value: d.volume,
          color:
            d.close >= d.open
              ? "rgba(38, 166, 91, 0.25)"
              : "rgba(239, 83, 80, 0.25)",
        }))
      );
    }

    // SMA overlay
    if (indicators.includes("sma")) {
      const sma20 = calculateSMA(data, 20);
      const smaSeries = mainChart.addLineSeries({
        color: "#f59e0b",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        title: "SMA 20",
      });
      smaSeries.setData(sma20);
    }

    // EMA overlay
    if (indicators.includes("ema")) {
      const ema12 = calculateEMA(data, 12);
      const emaSeries = mainChart.addLineSeries({
        color: "#a78bfa",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        title: "EMA 12",
      });
      emaSeries.setData(ema12);
    }

    // Bollinger Bands
    if (indicators.includes("bollinger")) {
      const bb = calculateBollingerBands(data);
      const upperSeries = mainChart.addLineSeries({
        color: "rgba(59, 130, 246, 0.5)",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        title: "BB Upper",
      });
      upperSeries.setData(bb.upper);

      const middleSeries = mainChart.addLineSeries({
        color: "rgba(59, 130, 246, 0.3)",
        lineWidth: 1,
        crosshairMarkerVisible: false,
      });
      middleSeries.setData(bb.middle);

      const lowerSeries = mainChart.addLineSeries({
        color: "rgba(59, 130, 246, 0.5)",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        title: "BB Lower",
      });
      lowerSeries.setData(bb.lower);
    }

    mainChart.timeScale().fitContent();

    // Sub-indicator chart (MACD, RSI, Stochastic)
    if (hasSubChart && indicatorChartRef.current) {
      const indicatorChart = createChart(indicatorChartRef.current, {
        ...chartOptions,
        width: indicatorChartRef.current.clientWidth,
        height: 160,
        rightPriceScale: {
          ...chartOptions.rightPriceScale,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });
      indicatorChartApiRef.current = indicatorChart;

      if (indicators.includes("macd")) {
        const macd = calculateMACD(data);

        const macdSeries = indicatorChart.addLineSeries({
          color: "#3b82f6",
          lineWidth: 1,
          title: "MACD",
          crosshairMarkerVisible: false,
        });
        macdSeries.setData(macd.macdLine);

        const signalSeries = indicatorChart.addLineSeries({
          color: "#ef5350",
          lineWidth: 1,
          title: "Signal",
          crosshairMarkerVisible: false,
        });
        signalSeries.setData(macd.signalLine);

        const histogramSeries = indicatorChart.addHistogramSeries({
          priceScaleId: "histogram",
        });
        histogramSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.6, bottom: 0 },
        });
        histogramSeries.setData(macd.histogram);
      }

      if (indicators.includes("rsi")) {
        const rsi = calculateRSI(data);
        const rsiSeries = indicatorChart.addLineSeries({
          color: "#a78bfa",
          lineWidth: 1,
          title: "RSI",
          crosshairMarkerVisible: false,
        });
        rsiSeries.setData(rsi);

        // Overbought/oversold reference lines
        const overbought = rsi.map((d) => ({ time: d.time, value: 70 }));
        const oversold = rsi.map((d) => ({ time: d.time, value: 30 }));

        const obSeries = indicatorChart.addLineSeries({
          color: "rgba(239, 83, 80, 0.3)",
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lineStyle: 2,
        });
        obSeries.setData(overbought);

        const osSeries = indicatorChart.addLineSeries({
          color: "rgba(38, 166, 91, 0.3)",
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lineStyle: 2,
        });
        osSeries.setData(oversold);
      }

      if (indicators.includes("stochastic")) {
        const stoch = calculateStochastic(data);

        const kSeries = indicatorChart.addLineSeries({
          color: "#3b82f6",
          lineWidth: 1,
          title: "%K",
          crosshairMarkerVisible: false,
        });
        kSeries.setData(stoch.kLine);

        const dSeries = indicatorChart.addLineSeries({
          color: "#ef5350",
          lineWidth: 1,
          title: "%D",
          crosshairMarkerVisible: false,
        });
        dSeries.setData(stoch.dLine);

        // Reference lines
        const obLine = stoch.kLine.map((d) => ({ time: d.time, value: 80 }));
        const osLine = stoch.kLine.map((d) => ({ time: d.time, value: 20 }));

        const obSeries2 = indicatorChart.addLineSeries({
          color: "rgba(239, 83, 80, 0.3)",
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lineStyle: 2,
        });
        obSeries2.setData(obLine);

        const osSeries2 = indicatorChart.addLineSeries({
          color: "rgba(38, 166, 91, 0.3)",
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lineStyle: 2,
        });
        osSeries2.setData(osLine);
      }

      indicatorChart.timeScale().fitContent();

      // Sync time scales
      mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) {
          indicatorChart.timeScale().setVisibleLogicalRange(range);
        }
      });
      indicatorChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) {
          mainChart.timeScale().setVisibleLogicalRange(range);
        }
      });
    }
  }, [data, chartType, indicators, hasSubChart]);

  useEffect(() => {
    buildChart();

    const handleResize = () => {
      if (mainChartRef.current && mainChartApiRef.current) {
        mainChartApiRef.current.applyOptions({
          width: mainChartRef.current.clientWidth,
        });
      }
      if (indicatorChartRef.current && indicatorChartApiRef.current) {
        indicatorChartApiRef.current.applyOptions({
          width: indicatorChartRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mainChartApiRef.current) {
        mainChartApiRef.current.remove();
        mainChartApiRef.current = null;
      }
      if (indicatorChartApiRef.current) {
        indicatorChartApiRef.current.remove();
        indicatorChartApiRef.current = null;
      }
    };
  }, [buildChart]);

  const lastPrice = data[data.length - 1];
  const prevPrice = data[data.length - 2];

  // Use live price if available, otherwise use last candle close
  const displayPrice = livePrice ?? lastPrice.close;
  const refPrice = previousClose ?? prevPrice.close;
  const priceChange = displayPrice - refPrice;
  const priceChangePercent = refPrice ? (priceChange / refPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const formatPrice = (val: number) => {
    if (currency === "IDR") {
      return `Rp${val.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const formatChangeVal = (val: number) => {
    if (currency === "IDR") {
      return val.toLocaleString("id-ID", { maximumFractionDigits: 0 });
    }
    return val.toFixed(2);
  };

  return (
    <div className="flex flex-col">
      {/* Price header */}
      <div className="flex items-baseline gap-4 px-4 py-3 border-b border-border flex-wrap">
        <span className="text-2xl font-semibold text-foreground font-mono">
          {formatPrice(displayPrice)}
        </span>
        <span
          className={`text-sm font-mono font-medium ${
            isPositive ? "text-[#26a65b]" : "text-[#ef5350]"
          }`}
        >
          {isPositive ? "+" : ""}
          {formatChangeVal(priceChange)} ({isPositive ? "+" : ""}
          {priceChangePercent.toFixed(2)}%)
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          O: {formatPrice(lastPrice.open)} H: {formatPrice(lastPrice.high)} L:{" "}
          {formatPrice(lastPrice.low)} V:{" "}
          {(lastPrice.volume / 1000000).toFixed(1)}M
        </span>
      </div>

      {/* Main chart */}
      <div ref={mainChartRef} className="w-full" />

      {/* Sub indicator chart */}
      {hasSubChart && (
        <div className="border-t border-border">
          <div className="px-4 py-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {indicators.includes("macd") && "MACD (12, 26, 9)"}
              {indicators.includes("rsi") && "RSI (14)"}
              {indicators.includes("stochastic") && "Stochastic (14, 3)"}
            </span>
          </div>
          <div ref={indicatorChartRef} className="w-full" />
        </div>
      )}
    </div>
  );
}
