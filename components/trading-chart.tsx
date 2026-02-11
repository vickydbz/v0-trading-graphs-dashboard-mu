"use client";

import { useMemo } from "react";
import type { OHLCData } from "@/lib/stock-data";

type Props = {
  data: OHLCData[];
  symbol: string;
  currency?: string;
  livePrice: number | null;
  previousClose: number | null;
  timeframe?: "1m" | "5m" | "15m" | "1h" | "1d";
};

export function TradingChart({
  data,
  symbol,
  currency,
  livePrice,
  previousClose,
  timeframe = "1m",
}: Props) {
  // ===== Guards
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );
  }

  // ===== Derived helpers
  const lastCandle = data[data.length - 1];

  const priceColor =
    livePrice != null && previousClose != null
      ? livePrice >= previousClose
        ? "text-green-500"
        : "text-red-500"
      : "text-foreground";

  // ===== Simple scale helpers (library-agnostic)
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);

  const priceToY = (price: number) => {
    if (maxPrice === minPrice) return 0;
    return ((maxPrice - price) / (maxPrice - minPrice)) * 100;
  };

  // ===== Lines (prev close & live)
  const prevCloseY =
    previousClose != null ? priceToY(previousClose) : null;
  const livePriceY =
    livePrice != null ? priceToY(livePrice) : null;

  return (
    <div className="relative h-full w-full bg-background">
      {/* ===== Header overlay */}
      <div className="absolute left-3 top-3 z-10 rounded bg-background/80 px-2 py-1 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{symbol}</span>
          <span className="text-muted-foreground">
            {timeframe.toUpperCase()}
          </span>
        </div>
        {livePrice != null && (
          <div className={`mt-1 ${priceColor}`}>
            {livePrice.toLocaleString()}{" "}
            {currency ? currency : ""}
          </div>
        )}
      </div>

      {/* ===== Chart canvas (reuse existing renderer) */}
      {/* NOTE:
          Di sini diasumsikan renderer candle lama lo tetap dipakai.
          Kita hanya MENAMBAH overlay garis & marker.
      */}
      <div className="absolute inset-0">
        {/* TODO: renderer candle lo yang lama tetap di sini */}
      </div>

      {/* ===== Prev Close line */}
      {prevCloseY != null && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/40"
          style={{ top: `${prevCloseY}%` }}
        >
          <div className="absolute right-2 -top-2 bg-background px-1 text-[10px] font-mono text-muted-foreground">
            Prev Close
          </div>
        </div>
      )}

      {/* ===== Live price marker */}
      {livePriceY != null && (
        <div
          className="absolute left-0 right-0"
          style={{ top: `${livePriceY}%` }}
        >
          <div className="absolute right-2 -top-2 rounded bg-background px-1 text-[10px] font-mono">
            <span className={priceColor}>
              {livePrice.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-primary/60" />
        </div>
      )}

      {/* ===== Footer hint */}
      <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground font-mono">
        Intraday view · auto-updating
      </div>
    </div>
  );
}
