"use client";

import { useState, useCallback, useMemo } from "react";
import { EMITENTS, TIME_RANGES, type TimeRange, generateOHLCData } from "@/lib/stock-data";
import { useStockData } from "@/hooks/use-stock-data"; // Hook ini sekarang diasumsikan pakai SWR dengan refreshInterval: 6000
import { TradingChart, type ChartType, type Indicator } from "@/components/trading-chart";
import { ChartControls } from "@/components/chart-controls";
import { EmitentSidebar } from "@/components/emitent-sidebar";
import { MarketOverview } from "@/components/market-overview";
import { ChartPanel, type ChartPanelState } from "@/components/chart-panel";
import {
  Activity,
  PanelLeftClose,
  PanelLeft,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

let panelIdCounter = 1;
function newPanelId() {
  return `panel-${panelIdCounter++}`;
}

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC-USD");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [indicators, setIndicators] = useState<Indicator[]>(["volume"]);
  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinnedSymbols, setPinnedSymbols] = useState<string[]>(["BTC-USD", "BBCA.JK"]);

  // Multi-view state
  const [panels, setPanels] = useState<ChartPanelState[]>([]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);

  const isMultiView = panels.length > 1;

  const rangeConfig = TIME_RANGES.find((r) => r.id === timeRange) || TIME_RANGES[6];
  
  // SWR Hook integration
  const { stockData, livePrice, previousClose, isLoading, isValidating, isError } =
    useStockData(selectedSymbol, rangeConfig.id, rangeConfig.interval);

  const fallbackData = useMemo(
    () => generateOHLCData(selectedSymbol, 365),
    [selectedSymbol]
  );

  const data = stockData && stockData.length > 0 ? stockData : fallbackData;
  const isLive = !!stockData && stockData.length > 0;
  const emitent = EMITENTS.find((e) => e.symbol === selectedSymbol);

  // Handlers
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

  const handleTogglePin = useCallback((symbol: string) => {
    setPinnedSymbols((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      if (prev.length >= 5) return prev;
      return [...prev, symbol];
    });
  }, []);

  const addView = useCallback(() => {
    setPanels((prev) => {
      if (prev.length === 0) {
        const currentPanel: ChartPanelState = {
          id: newPanelId(),
          symbol: selectedSymbol,
          chartType,
          indicators,
          timeRange,
        };
        const newPanel: ChartPanelState = {
          id: newPanelId(),
          symbol: "ETH-USD",
          chartType: "candlestick",
          indicators: ["volume"],
          timeRange: "1y",
        };
        setActivePanelId(newPanel.id);
        return [currentPanel, newPanel];
      }
      if (prev.length >= 5) return prev;
      const newPanel: ChartPanelState = {
        id: newPanelId(),
        symbol: selectedSymbol,
        chartType: "candlestick",
        indicators: ["volume"],
        timeRange: "1y",
      };
      setActivePanelId(newPanel.id);
      return [...prev, newPanel];
    });
  }, [selectedSymbol, chartType, indicators, timeRange]);

  const removeView = useCallback(() => {
    setPanels((prev) => {
      if (prev.length <= 1) {
        if (prev.length === 1) {
          setSelectedSymbol(prev[0].symbol);
          setChartType(prev[0].chartType);
          setIndicators(prev[0].indicators);
          setTimeRange(prev[0].timeRange);
        }
        return [];
      }
      const toRemove = activePanelId || prev[prev.length - 1].id;
      const remaining = prev.filter((p) => p.id !== toRemove);
      setActivePanelId(remaining[remaining.length - 1]?.id || null);
      return remaining;
    });
  }, [activePanelId]);

  const updatePanel = useCallback((panelId: string, updates: Partial<ChartPanelState>) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, ...updates } : p))
    );
  }, []);

  const handleSelectSymbol = useCallback(
    (symbol: string) => {
      if (panels.length > 0 && activePanelId) {
        updatePanel(activePanelId, { symbol });
      } else {
        setSelectedSymbol(symbol);
      }
    },
    [panels, activePanelId, updatePanel]
  );

  const gridClass = useMemo(() => {
    switch (panels.length) {
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-2 lg:grid-cols-3";
      case 4: return "grid-cols-2";
      case 5: return "grid-cols-2 lg:grid-cols-3";
      default: return "";
    }
  }, [panels.length]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <aside className="w-64 flex-shrink-0 hidden lg:flex">
          <EmitentSidebar
            selected={panels.length > 0 && activePanelId
              ? panels.find((p) => p.id === activePanelId)?.symbol || selectedSymbol
              : selectedSymbol
            }
            onSelect={handleSelectSymbol}
            pinnedSymbols={pinnedSymbols}
            onTogglePin={handleTogglePin}
          />
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="hidden lg:flex items-center justify-center h-8 w-8 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[hsl(var(--primary))]">
                <Activity className="h-3.5 w-3.5 text-[hsl(var(--primary-foreground))]" />
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight">TradeView</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Status with SWR Validation Logic */}
            <div className="flex items-center gap-2">
              {isValidating && <RefreshCw className="h-3 w-3 text-primary animate-spin" />}
              {isLive ? (
                <div className="flex items-center gap-1.5">
                  {/* Icon Wifi akan berkedip saat SWR sedang revalidasi (tiap 6 detik) */}
                  <Wifi className={`h-3 w-3 ${isValidating ? "animate-pulse text-yellow-500" : "text-[#26a65b]"}`} />
                  <span className={`text-[9px] font-mono font-medium uppercase ${isValidating ? "text-yellow-500" : "text-[#26a65b]"}`}>
                    {isValidating ? "Updating" : "Live"}
                  </span>
                </div>
              ) : isError ? (
                <div className="flex items-center gap-1.5">
                  <WifiOff className="h-3 w-3 text-[#ef5350]" />
                  <span className="text-[9px] font-mono font-medium text-[#ef5350] uppercase">Offline</span>
                </div>
              ) : isLoading ? (
                <span className="text-[9px] font-mono font-medium text-muted-foreground uppercase">Connecting...</span>
              ) : null}
            </div>

            {!isMultiView && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground font-mono tracking-tight">{selectedSymbol}</span>
                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{emitent?.exchange}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{emitent?.name}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <ChartControls
          chartType={chartType}
          onChartTypeChange={setChartType}
          indicators={indicators}
          onToggleIndicator={toggleIndicator}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          viewCount={panels.length > 0 ? panels.length : 1}
          onAddView={addView}
          onRemoveView={removeView}
          maxViews={5}
        />

        <div className="flex-1 overflow-auto relative">
          {panels.length > 1 ? (
            <div className={`grid ${gridClass} gap-2 p-2 h-full auto-rows-fr`}>
              {panels.map((panel) => (
                <ChartPanel
                  key={panel.id}
                  panel={panel}
                  isActive={panel.id === activePanelId}
                  totalPanels={panels.length}
                  onActivate={() => setActivePanelId(panel.id)}
                  onClose={() => {
                    setPanels((prev) => {
                      const remaining = prev.filter((p) => p.id !== panel.id);
                      if (remaining.length <= 1) {
                        if (remaining.length === 1) {
                          setSelectedSymbol(remaining[0].symbol);
                          setChartType(remaining[0].chartType);
                          setIndicators(remaining[0].indicators);
                          setTimeRange(remaining[0].timeRange);
                        }
                        return [];
                      }
                      if (activePanelId === panel.id) setActivePanelId(remaining[0].id);
                      return remaining;
                    });
                  }}
                  onUpdate={(updates) => updatePanel(panel.id, updates)}
                />
              ))}
            </div>
          ) : (
            <>
              {isLoading && !stockData && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground font-mono">Loading data...</span>
                  </div>
                </div>
              )}
              <TradingChart
                key={`single-${selectedSymbol}-${chartType}-${indicators.join(",")}-${timeRange}`}
                data={data}
                chartType={chartType}
                indicators={indicators}
                symbol={selectedSymbol}
                currency={emitent?.currency}
                livePrice={livePrice}
                previousClose={previousClose}
              />
            </>
          )}
        </div>

        {!isMultiView && (
          <MarketOverview data={data} symbol={selectedSymbol} currency={emitent?.currency} />
        )}
      </main>
    </div>
  );
}
