"use client";

import { useMemo } from "react";
import type { OHLCData } from "@/lib/stock-data";
import clsx from "clsx";

type Props = {
  data: OHLCData[];
  symbol: string;
  currency?: string;
};

export function MarketOverview({ data, symbol, currency }: Props) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const volumes = data.map((d) => d.volume);

    const high = Math.max(...highs);
    const low = Math.min(...lows);
    const last = data[data.length - 1].close;

    const avgVolume =
      volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const lastVolume = volumes[volumes.length - 1] ?? 0;
    const volumeRatio = avgVolume ? lastVolume / avgVolume : 0;

    const rangePct = high !== low ? ((high - low) / low) * 100 : 0;

    let volatility: "Low" | "Normal" | "High" = "Normal";
    if (rangePct < 1.2) volatility = "Low";
    else if (rangePct > 3) volatility = "High";

    return {
      high,
      low,
      last,
      volumeRatio,
      volatility,
    };
  }, [data]);

  if (!stats) {
    return (
      <div className="border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        No market data
      </div>
    );
  }

  const rangePercent =
    stats.high !== stats.low
      ? ((stats.last - stats.low) / (stats.high - stats.low)) * 100
      : 0;

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-mono">
          {symbol} · {currency}
        </div>
        <div
          className={clsx(
            "text-[10px] font-mono uppercase",
            stats.volatility === "High" && "text-red-500",
            stats.volatility === "Low" && "text-muted-foreground",
            stats.volatility === "Normal" && "text-yellow-500"
          )}
        >
          Volatility: {stats.volatility}
        </div>
      </div>

      {/* Range bar */}
      <div className="mb-3">
        <div className="relative h-2 rounded bg-secondary">
          <div
            className="absolute top-0 h-2 rounded bg-primary"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, rangePercent)
              )}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>Low {stats.low.toLocaleString()}</span>
          <span>High {stats.high.toLocaleString()}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground">Volume</span>
        <span
          className={clsx(
            stats.volumeRatio > 1.5 && "text-green-500",
            stats.volumeRatio < 0.7 && "text-muted-foreground"
          )}
        >
          {stats.volumeRatio.toFixed(2)}× avg
        </span>
      </div>
    </div>
  );
}
