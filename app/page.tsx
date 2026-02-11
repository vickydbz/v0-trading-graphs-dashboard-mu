"use client";

import { useState, useMemo, useCallback } from "react";
import { generateOHLCData, EMITENTS } from "@/lib/stock-data";
import { useStockData } from "@/hooks/use-stock-data";
import {
  TradingChart,
  type ChartType,
  type Indicator,
} from "@/components/trading-chart";
import { ChartControls } from "@/components/chart-controls";
import { EmitentSidebar } from "@/components/emitent-sidebar";
import { MarketOverview } from "@/components/market-overview";
import { Activity, PanelLeftClose, PanelLeft, Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("BBCA.JK");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [indicators, setIndicators] = useState<Indicator[]>(["volume"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { stockData, livePrice, previousClose, isLoading, isValidating, isError } =
    useStockData(selectedSymbol);

  // Fallback to generated data if API fails
  const fallbackData = useMemo(
    () => generateOHLCData(selectedSymbol, 365),
    [selectedSymbol]
  );

  const data = stockData && stockData.length > 0 ? stockData : fallbackData;
  const isLive = !!stockData && stockData.length > 0;

  const emitent = EMITENTS.find((e) => e.symbol === selectedSymbol);

  const toggleIndicator = useCallback((indicator: Indicator) => {
    setIndicators((prev) => {
      const subIndicators: Indicator[] = ["macd", "rsi", "stochastic"];
      if (subIndicators.includes(indicator)) {
        const hasIt = prev.includes(indicator);
        const withoutSub = prev.filter((i) => !subIndicators.includes(i));
        return hasIt ? withoutSub : [...withoutSub, indicator];
      }
      return prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator];
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 flex-shrink-0 hidden lg:flex">
          <EmitentSidebar
            selected={selectedSymbol}
            onSelect={setSelectedSymbol}
          />
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="hidden lg:flex items-center justify-center h-8 w-8 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[hsl(var(--primary))]">
                <Activity className="h-4 w-4 text-[hsl(var(--primary-foreground))]" />
              </div>
              <span className="text-base font-semibold text-foreground tracking-tight">
                TradeView
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live status */}
            <div className="flex items-center gap-2">
              {isValidating && (
                <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
              )}
              {isLive ? (
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3 w-3 text-[#26a65b]" />
                  <span className="text-[9px] font-mono font-medium text-[#26a65b] uppercase">
                    Live
                  </span>
                </div>
              ) : isError ? (
                <div className="flex items-center gap-1.5">
                  <WifiOff className="h-3 w-3 text-[#ef5350]" />
                  <span className="text-[9px] font-mono font-medium text-[#ef5350] uppercase">
                    Offline
                  </span>
                </div>
              ) : isLoading ? (
                <span className="text-[9px] font-mono font-medium text-muted-foreground uppercase">
                  Connecting...
                </span>
              ) : null}
            </div>

            {/* Symbol info */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground font-mono tracking-tight">
                    {selectedSymbol}
                  </span>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {emitent?.exchange}
                  </span>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {emitent?.currency}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {emitent?.name} &middot; {emitent?.sector}
                </span>
              </div>
            </div>

            {/* Mobile emitent selector */}
            <div className="lg:hidden">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="h-8 rounded bg-secondary border border-border text-xs text-foreground px-2 font-mono"
              >
                {EMITENTS.map((e) => (
                  <option key={e.symbol} value={e.symbol}>
                    {e.symbol} - {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Chart Controls */}
        <ChartControls
          chartType={chartType}
          onChartTypeChange={setChartType}
          indicators={indicators}
          onToggleIndicator={toggleIndicator}
        />

        {/* Chart Area */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading && !stockData && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground font-mono">
                  Loading live data...
                </span>
              </div>
            </div>
          )}
          <TradingChart
            key={`${selectedSymbol}-${chartType}-${indicators.join(",")}-${isLive ? "live" : "fallback"}`}
            data={data}
            chartType={chartType}
            indicators={indicators}
            symbol={selectedSymbol}
            currency={emitent?.currency}
            livePrice={livePrice}
            previousClose={previousClose}
          />
        </div>

        {/* Bottom Stats */}
        <MarketOverview data={data} symbol={selectedSymbol} currency={emitent?.currency} />
      </main>
    </div>
  );
}
