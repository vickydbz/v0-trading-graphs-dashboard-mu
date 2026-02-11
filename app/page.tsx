"use client";

import { useEffect, useMemo, useState } from "react";
import { useStockData } from "@/hooks/useStockData";
import { EMITENTS } from "@/lib/stock-data";
import { TradingChart } from "@/components/trading-chart";
import { ChartControls } from "@/components/chart-controls";
import { EmitentSidebar } from "@/components/emitent-sidebar";
import { MarketOverview } from "@/components/market-overview";
import {
  Activity,
  PanelLeftClose,
  PanelLeft,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "1d";

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("BBCA.JK");
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    stockData,
    livePrice,
    previousClose,
    isLoading,
    isValidating,
    isError,
  } = useStockData(selectedSymbol, timeframe);

  const emitent = EMITENTS.find((e) => e.symbol === selectedSymbol);

  // ===== Price math (safe)
  const priceStats = useMemo(() => {
    if (livePrice == null || previousClose == null) {
      return { diff: null, pct: null };
    }
    const diff = livePrice - previousClose;
    const pct = (diff / previousClose) * 100;
    return { diff, pct };
  }, [livePrice, previousClose]);

  // ===== Flash on update
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (priceStats.diff == null) return;
    setFlash(priceStats.diff >= 0 ? "up" : "down");
    const t = setTimeout(() => setFlash(null), 300);
    return () => clearTimeout(t);
  }, [livePrice]); // trigger tiap update harga

  // ===== “Updated Xs ago”
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  useEffect(() => {
    setSecondsAgo(0);
    const t = setInterval(() => {
      setSecondsAgo((s) => (s == null ? null : s + 1));
    }, 1000);
    return () => clearInterval(t);
  }, [livePrice]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 flex-shrink-0 hidden lg:flex border-r border-border">
          <EmitentSidebar
            selected={selectedSymbol}
            onSelect={setSelectedSymbol}
          />
        </aside>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="hidden lg:flex items-center justify-center h-8 w-8 rounded hover:bg-secondary"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">TradeView</span>
            </div>
          </div>

          {/* Center: Price */}
          <div className="flex items-center gap-4">
            <div
              className={[
                "flex items-baseline gap-3 font-mono",
                flash === "up" ? "text-green-500" : "",
                flash === "down" ? "text-red-500" : "",
              ].join(" ")}
            >
              <span className="text-2xl font-bold">
                {livePrice != null ? livePrice.toLocaleString() : "—"}
              </span>
              {priceStats.diff != null && (
                <span className="text-sm">
                  {priceStats.diff >= 0 ? "+" : ""}
                  {priceStats.diff.toFixed(2)} (
                  {priceStats.pct?.toFixed(2)}%)
                </span>
              )}
            </div>

            <div className="text-[10px] text-muted-foreground font-mono">
              {secondsAgo != null ? `Updated ${secondsAgo}s ago` : ""}
            </div>
          </div>

          {/* Right: Status */}
          <div className="flex items-center gap-3">
            {isValidating && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
            {!isError ? (
              <div className="flex items-center gap-1 text-green-500 text-xs font-mono">
                <Wifi className="h-3 w-3" /> LIVE
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 text-xs font-mono">
                <WifiOff className="h-3 w-3" /> OFFLINE
              </div>
            )}
            <div className="text-right">
              <div className="text-xs font-mono">{selectedSymbol}</div>
              <div className="text-[10px] text-muted-foreground">
                {emitent?.exchange} · {emitent?.currency}
              </div>
            </div>
          </div>
        </header>

        {/* Controls */}
        <ChartControls
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />

        {/* Chart */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading && !stockData?.length && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <TradingChart
            data={stockData}
            symbol={selectedSymbol}
            currency={emitent?.currency}
            livePrice={livePrice}
            previousClose={previousClose}
            timeframe={timeframe}
          />
        </div>

        {/* Overview */}
        <MarketOverview
          data={stockData}
          symbol={selectedSymbol}
          currency={emitent?.currency}
        />
      </main>
    </div>
  );
}
