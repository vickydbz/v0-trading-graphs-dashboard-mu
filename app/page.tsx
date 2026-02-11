"use client";

import { useState, useMemo, useCallback } from "react";
import { generateOHLCData, EMITENTS } from "@/lib/stock-data";
import {
  TradingChart,
  type ChartType,
  type Indicator,
} from "@/components/trading-chart";
import { ChartControls } from "@/components/chart-controls";
import { EmitentSidebar } from "@/components/emitent-sidebar";
import { MarketOverview } from "@/components/market-overview";
import { Activity, PanelLeftClose, PanelLeft } from "lucide-react";

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [indicators, setIndicators] = useState<Indicator[]>(["volume"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const data = useMemo(
    () => generateOHLCData(selectedSymbol, 365),
    [selectedSymbol]
  );

  const emitent = EMITENTS.find((e) => e.symbol === selectedSymbol);

  const toggleIndicator = useCallback((indicator: Indicator) => {
    setIndicators((prev) => {
      // Only allow one sub-chart indicator at a time (macd, rsi, stochastic)
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
        <div className="flex-1 overflow-hidden">
          <TradingChart
            key={`${selectedSymbol}-${chartType}-${indicators.join(",")}`}
            data={data}
            chartType={chartType}
            indicators={indicators}
            symbol={selectedSymbol}
          />
        </div>

        {/* Bottom Stats */}
        <MarketOverview data={data} symbol={selectedSymbol} currency={emitent?.currency} />
      </main>
    </div>
  );
}
