"use client";

import { useMemo, useState } from "react";
import { EMITENTS, generateOHLCData } from "@/lib/stock-data";
import { useQuotes } from "@/hooks/use-stock-data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Wifi } from "lucide-react";

interface EmitentSidebarProps {
  selected: string;
  onSelect: (symbol: string) => void;
}

export function EmitentSidebar({ selected, onSelect }: EmitentSidebarProps) {
  const [search, setSearch] = useState("");
  const allSymbols = useMemo(() => EMITENTS.map((e) => e.symbol), []);
  const { quotes, isLoading: quotesLoading } = useQuotes(allSymbols);

  // Fallback prices from generated data
  const fallbackData = useMemo(() => {
    const map: Record<string, { price: number; change: number; changePercent: number; isPositive: boolean }> = {};
    for (const e of EMITENTS) {
      const data = generateOHLCData(e.symbol, 30);
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      const change = last.close - prev.close;
      const changePercent = (change / prev.close) * 100;
      map[e.symbol] = { price: last.close, change, changePercent, isPositive: change >= 0 };
    }
    return map;
  }, []);

  const emitentData = useMemo(() => {
    return EMITENTS.map((e) => {
      const liveQuote = quotes[e.symbol];
      if (liveQuote) {
        return {
          symbol: e.symbol,
          name: e.name,
          sector: e.sector,
          exchange: e.exchange,
          currency: e.currency,
          price: liveQuote.price,
          change: liveQuote.change,
          changePercent: liveQuote.changePercent,
          isPositive: liveQuote.change >= 0,
          isLive: true,
        };
      }
      const fb = fallbackData[e.symbol];
      return {
        symbol: e.symbol,
        name: e.name,
        sector: e.sector,
        exchange: e.exchange,
        currency: e.currency,
        price: fb?.price ?? 0,
        change: fb?.change ?? 0,
        changePercent: fb?.changePercent ?? 0,
        isPositive: fb?.isPositive ?? true,
        isLive: false,
      };
    });
  }, [quotes, fallbackData]);

  const filtered = emitentData.filter(
    (e) =>
      e.symbol.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce(
    (acc, e) => {
      if (!acc[e.exchange]) acc[e.exchange] = [];
      acc[e.exchange].push(e);
      return acc;
    },
    {} as Record<string, typeof filtered>
  );

  const exchangeOrder = ["NASDAQ", "NYSE", "IDX"];
  const sortedExchanges = Object.keys(grouped).sort(
    (a, b) =>
      (exchangeOrder.indexOf(a) === -1 ? 99 : exchangeOrder.indexOf(a)) -
      (exchangeOrder.indexOf(b) === -1 ? 99 : exchangeOrder.indexOf(b))
  );

  const hasAnyLive = emitentData.some((e) => e.isLive);

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Instruments
          </h2>
          {hasAnyLive && (
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3 text-[#26a65b]" />
              <span className="text-[9px] font-mono text-[#26a65b] uppercase">Live</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {sortedExchanges.map((exchange) => (
            <div key={exchange} className="mb-2">
              <div className="px-4 py-1.5 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {exchange}
                </span>
                <span className="text-[9px] text-muted-foreground/60">
                  {exchange === "IDX" ? "Indonesia" : "United States"}
                </span>
              </div>
              {grouped[exchange].map((e) => {
                const currencySymbol = e.currency === "IDR" ? "Rp" : "$";
                const priceDisplay =
                  e.currency === "IDR"
                    ? `${currencySymbol}${e.price.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
                    : `${currencySymbol}${e.price.toFixed(2)}`;
                return (
                  <button
                    key={e.symbol}
                    onClick={() => onSelect(e.symbol)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                      "hover:bg-secondary/80",
                      selected === e.symbol &&
                        "bg-secondary border-l-2 border-l-[hsl(var(--primary))]"
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground font-mono">
                          {e.symbol}
                        </span>
                        {e.isLive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#26a65b]" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {e.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-mono text-foreground">
                        {quotesLoading && !e.isLive ? (
                          <span className="text-muted-foreground">---</span>
                        ) : (
                          priceDisplay
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono font-medium",
                          e.isPositive ? "text-[#26a65b]" : "text-[#ef5350]"
                        )}
                      >
                        {e.isPositive ? "+" : ""}
                        {e.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
