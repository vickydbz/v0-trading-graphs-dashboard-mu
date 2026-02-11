"use client";

import { useMemo, useCallback } from "react";
import { EMITENTS, generateOHLCData, TIME_RANGES, type TimeRange } from "@/lib/stock-data";
import { useStockData } from "@/hooks/use-stock-data";
import { TradingChart, type ChartType, type Indicator } from "@/components/trading-chart";
import { RefreshCw, X, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChartPanelState {
  id: string;
  symbol: string;
  chartType: ChartType;
  indicators: Indicator[];
  timeRange: TimeRange;
}

interface ChartPanelProps {
  panel: ChartPanelState;
  isActive: boolean;
  totalPanels: number;
  onActivate: () => void;
  onClose: () => void;
  onUpdate: (updates: Partial<ChartPanelState>) => void;
}

export function ChartPanel({
  panel,
  isActive,
  totalPanels,
  onActivate,
  onClose,
  onUpdate,
}: ChartPanelProps) {
  const rangeConfig = TIME_RANGES.find((r) => r.id === panel.timeRange) || TIME_RANGES[6];

  const { stockData, livePrice, previousClose, isLoading, isValidating, isError } =
    useStockData(panel.symbol, rangeConfig.id, rangeConfig.interval);

  const fallbackData = useMemo(
    () => generateOHLCData(panel.symbol, 365),
    [panel.symbol]
  );

  const data = stockData && stockData.length > 0 ? stockData : fallbackData;
  const isLive = !!stockData && stockData.length > 0;
  const emitent = EMITENTS.find((e) => e.symbol === panel.symbol);

  const toggleIndicator = useCallback(
    (indicator: Indicator) => {
      const subIndicators: Indicator[] = ["macd", "rsi", "stochastic"];
      if (subIndicators.includes(indicator)) {
        const hasIt = panel.indicators.includes(indicator);
        const withoutSub = panel.indicators.filter((i) => !subIndicators.includes(i));
        onUpdate({ indicators: hasIt ? withoutSub : [...withoutSub, indicator] });
      } else {
        onUpdate({
          indicators: panel.indicators.includes(indicator)
            ? panel.indicators.filter((i) => i !== indicator)
            : [...panel.indicators, indicator],
        });
      }
    },
    [panel.indicators, onUpdate]
  );

  const isCompact = totalPanels > 1;

  return (
    <div
      onClick={onActivate}
      className={cn(
        "flex flex-col border border-border rounded-lg overflow-hidden bg-card transition-all h-full",
        isActive && totalPanels > 1 && "ring-1 ring-[hsl(var(--primary))]/40"
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-foreground font-mono truncate">
            {panel.symbol}
          </span>
          {emitent && (
            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground truncate hidden sm:inline">
              {emitent.exchange}
            </span>
          )}
          <div className="flex items-center gap-1">
            {isValidating && <RefreshCw className="h-2.5 w-2.5 text-muted-foreground animate-spin" />}
            {isLive ? (
              <Wifi className="h-2.5 w-2.5 text-[#26a65b]" />
            ) : isError ? (
              <WifiOff className="h-2.5 w-2.5 text-[#ef5350]" />
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Time range selector */}
          <div className="flex items-center gap-0.5">
            {TIME_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ timeRange: range.id });
                }}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all",
                  panel.timeRange === range.id
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          {totalPanels > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mini controls row */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border overflow-x-auto">
        {/* Chart type */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ chartType: panel.chartType === "candlestick" ? "line" : "candlestick" });
          }}
          className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          {panel.chartType === "candlestick" ? "Candle" : "Line"}
        </button>
        <div className="w-px h-3.5 bg-border flex-shrink-0" />
        {(["volume", "sma", "ema", "bollinger", "macd", "rsi", "stochastic"] as Indicator[]).map(
          (ind) => (
            <button
              key={ind}
              onClick={(e) => {
                e.stopPropagation();
                toggleIndicator(ind);
              }}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all whitespace-nowrap",
                panel.indicators.includes(ind)
                  ? "bg-secondary text-foreground ring-1 ring-[hsl(var(--primary))]/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {ind === "volume" ? "VOL" : ind === "bollinger" ? "BB" : ind === "stochastic" ? "STOCH" : ind.toUpperCase()}
            </button>
          )
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {isLoading && !stockData && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              <span className="text-[10px] text-muted-foreground font-mono">Loading...</span>
            </div>
          </div>
        )}
        <TradingChart
          key={`${panel.id}-${panel.symbol}-${panel.chartType}-${panel.indicators.join(",")}-${panel.timeRange}-${isLive ? "live" : "fb"}`}
          data={data}
          chartType={panel.chartType}
          indicators={isCompact ? panel.indicators.filter((i) => !["macd", "rsi", "stochastic"].includes(i)) : panel.indicators}
          symbol={panel.symbol}
          currency={emitent?.currency}
          livePrice={livePrice}
          previousClose={previousClose}
          compact={isCompact}
        />
      </div>
    </div>
  );
}
