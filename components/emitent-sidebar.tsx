"use client";

import { useMemo } from "react";
import { EMITENTS, generateOHLCData } from "@/lib/stock-data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface EmitentSidebarProps {
  selected: string;
  onSelect: (symbol: string) => void;
}

export function EmitentSidebar({ selected, onSelect }: EmitentSidebarProps) {
  const [search, setSearch] = useState("");

  const emitentData = useMemo(() => {
    return EMITENTS.map((e) => {
      const data = generateOHLCData(e.symbol, 30);
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      const change = last.close - prev.close;
      const changePercent = (change / prev.close) * 100;
      return {
        symbol: e.symbol,
        name: e.name,
        sector: e.sector,
        exchange: e.exchange,
        currency: e.currency,
        price: last.close,
        change,
        changePercent,
        isPositive: change >= 0,
      };
    });
  }, []);

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
    (a, b) => (exchangeOrder.indexOf(a) === -1 ? 99 : exchangeOrder.indexOf(a)) -
              (exchangeOrder.indexOf(b) === -1 ? 99 : exchangeOrder.indexOf(b))
  );

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-4 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3 tracking-wide uppercase">
          Instruments
        </h2>
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
                const priceDisplay = e.currency === "IDR"
                  ? `${currencySymbol}${e.price.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
                  : `${currencySymbol}${e.price.toFixed(2)}`;
                return (
                  <button
                    key={e.symbol}
                    onClick={() => onSelect(e.symbol)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                      "hover:bg-secondary/80",
                      selected === e.symbol && "bg-secondary border-l-2 border-l-[hsl(var(--primary))]"
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground font-mono">
                        {e.symbol}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {e.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-mono text-foreground">
                        {priceDisplay}
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
