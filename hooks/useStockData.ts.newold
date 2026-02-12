"use client";

import { useEffect, useRef, useState } from "react";
import { OHLCData } from "@/lib/stock-data";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "1d";

const INTERVAL_MAP: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "60m",
  "1d": "1d",
};

export function useStockData(symbol: string, timeframe: Timeframe = "1m") {
  const [stockData, setStockData] = useState<OHLCData[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [previousClose, setPreviousClose] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isError, setIsError] = useState(false);

  const timerRef = useRef<any>(null);


  // -----------------------------
  // FETCH DATA FROM YAHOO
  // -----------------------------
  const fetchYahoo = async () => {
    try {
      setIsValidating(true);

      const interval = INTERVAL_MAP[timeframe];
      const range = timeframe === "1d" ? "6mo" : "1d";

      const res = await fetch(
        `/api/quote?symbol=${symbol}&interval=${interval}&range=${range}`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("Yahoo fetch failed");

      const json = await res.json();
      const result = json.chart?.result?.[0];
      if (!result) throw new Error("Invalid Yahoo response");

      const timestamps: number[] = result.timestamp || [];
      const quote = result.indicators.quote?.[0];
      if (!quote) throw new Error("No quote data");

      const candles: OHLCData[] = timestamps
        .map((t, i) => ({
          time: new Date(t * 1000).toISOString().split("T")[0],
          open: quote.open?.[i],
          high: quote.high?.[i],
          low: quote.low?.[i],
          close: quote.close?.[i],
          volume: quote.volume?.[i] ?? 0,
        }))
        .filter((c) => c.close != null);

      if (candles.length === 0) throw new Error("Empty candles");

      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];

      setStockData(candles);
      setLivePrice(last.close);
      setPreviousClose(prev?.close ?? null);

      setIsError(false);
      setIsLoading(false);
    } catch (err) {
      console.error("[useStockData]", err);
      setIsError(true);
      setIsLoading(false);
    } finally {
      setIsValidating(false);
    }
  };

  // -----------------------------
  // AUTO REFRESH (7s)
  // -----------------------------
  useEffect(() => {
    setIsLoading(true);
    fetchYahoo();

    timerRef.current = setInterval(fetchYahoo, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, timeframe]);

  return {
    stockData,
    livePrice,
    previousClose,
    isLoading,
    isValidating,
    isError,
  };
}
