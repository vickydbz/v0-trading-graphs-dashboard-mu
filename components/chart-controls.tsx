"use client";

import React from "react";

import { cn } from "@/lib/utils";
import type { ChartType, Indicator } from "@/components/trading-chart";
import { TIME_RANGES, type TimeRange } from "@/lib/stock-data";
import {
  BarChart3,
  LineChart,
  TrendingUp,
  Activity,
  Layers,
  BarChart,
  Waves,
  ArrowUpDown,
  LayoutGrid,
  Plus,
  Minus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChartControlsProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  indicators: Indicator[];
  onToggleIndicator: (indicator: Indicator) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  viewCount: number;
  onAddView: () => void;
  onRemoveView: () => void;
  maxViews?: number;
}

const INDICATOR_OPTIONS: {
  id: Indicator;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "volume", label: "VOL", description: "Volume", icon: BarChart },
  { id: "sma", label: "SMA", description: "Simple Moving Average (20)", icon: TrendingUp },
  { id: "ema", label: "EMA", description: "Exponential Moving Average (12)", icon: Activity },
  { id: "bollinger", label: "BB", description: "Bollinger Bands (20, 2)", icon: Layers },
  { id: "macd", label: "MACD", description: "MACD (12, 26, 9)", icon: Waves },
  { id: "rsi", label: "RSI", description: "Relative Strength Index (14)", icon: ArrowUpDown },
  { id: "stochastic", label: "STOCH", description: "Stochastic Oscillator (14, 3)", icon: Activity },
];

export function ChartControls({
  chartType,
  onChartTypeChange,
  indicators,
  onToggleIndicator,
  timeRange,
  onTimeRangeChange,
  viewCount,
  onAddView,
  onRemoveView,
  maxViews = 5,
}: ChartControlsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card overflow-x-auto">
        {/* Chart Type Toggle */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-1">
            Chart
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChartTypeChange("candlestick")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all",
                  chartType === "candlestick"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Candle</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Candlestick Chart</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChartTypeChange("line")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all",
                  chartType === "line"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <LineChart className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Line</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Line Chart</p></TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Time Range */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-1">
            Range
          </span>
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => onTimeRangeChange(range.id)}
              className={cn(
                "px-1.5 py-1 rounded text-[10px] font-mono font-medium transition-all",
                timeRange === range.id
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Indicators */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-1">
            Ind
          </span>
          {INDICATOR_OPTIONS.map((ind) => {
            const isActive = indicators.includes(ind.id);
            const Icon = ind.icon;
            return (
              <Tooltip key={ind.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToggleIndicator(ind.id)}
                    className={cn(
                      "flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all",
                      isActive
                        ? "bg-secondary text-foreground ring-1 ring-[hsl(var(--primary))]/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden lg:inline">{ind.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>{ind.description}</p></TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Multi-view controls */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-1">
            Views
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onRemoveView}
                disabled={viewCount <= 1}
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded transition-all",
                  viewCount <= 1
                    ? "text-muted-foreground/30 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Minus className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Remove view</p></TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary">
            <LayoutGrid className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-mono font-medium text-foreground">
              {viewCount}/{maxViews}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddView}
                disabled={viewCount >= maxViews}
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded transition-all",
                  viewCount >= maxViews
                    ? "text-muted-foreground/30 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Plus className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Add view (max {maxViews})</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
