"use client";

import React from "react"

import { cn } from "@/lib/utils";
import type { ChartType, Indicator } from "@/components/trading-chart";
import {
  BarChart3,
  LineChart,
  TrendingUp,
  Activity,
  Layers,
  BarChart,
  Waves,
  ArrowUpDown,
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
}

const INDICATOR_OPTIONS: {
  id: Indicator;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "volume",
    label: "VOL",
    description: "Volume",
    icon: BarChart,
  },
  {
    id: "sma",
    label: "SMA",
    description: "Simple Moving Average (20)",
    icon: TrendingUp,
  },
  {
    id: "ema",
    label: "EMA",
    description: "Exponential Moving Average (12)",
    icon: Activity,
  },
  {
    id: "bollinger",
    label: "BB",
    description: "Bollinger Bands (20, 2)",
    icon: Layers,
  },
  {
    id: "macd",
    label: "MACD",
    description: "MACD (12, 26, 9)",
    icon: Waves,
  },
  {
    id: "rsi",
    label: "RSI",
    description: "Relative Strength Index (14)",
    icon: ArrowUpDown,
  },
  {
    id: "stochastic",
    label: "STOCH",
    description: "Stochastic Oscillator (14, 3)",
    icon: Activity,
  },
];

export function ChartControls({
  chartType,
  onChartTypeChange,
  indicators,
  onToggleIndicator,
}: ChartControlsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-6 px-4 py-2.5 border-b border-border bg-card">
        {/* Chart Type Toggle */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-2">
            Chart
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChartTypeChange("candlestick")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all",
                  chartType === "candlestick"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Candle</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Candlestick Chart</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChartTypeChange("line")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all",
                  chartType === "line"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <LineChart className="h-3.5 w-3.5" />
                <span>Line</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Line Chart</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border" />

        {/* Indicators */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-2">
            Indicators
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
                      "flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all",
                      isActive
                        ? "bg-secondary text-foreground ring-1 ring-[hsl(var(--primary))]/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{ind.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{ind.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
