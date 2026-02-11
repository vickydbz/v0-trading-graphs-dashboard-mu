"use client";

import { useMemo, useState } from "react";
import { EMITENTS, generateOHLCData } from "@/lib/stock-data";
import { useQuotes } from "@/hooks/use-stock-data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Wifi, Pin, PinOff } from "lucide-react";

interface EmitentSidebarProps {
  selected: string;
  onSelect: (symbol: string) => void;
  pinnedSymbols: string[];
  onTogglePin: (symbol: string) => void;
}

export function EmitentSidebar({
  selected,
  onSelect,
  pinnedSymbols,
  onTogglePin,
}: EmitentSidebarProps) {
  const [search, setSearch] = useState("");
  const allSymbols = useMemo(() => EMITENTS.map((e) => e.symbol), []);
  const { quotes, isLoading: quotesLoading } = useQuotes(allSymbols);

  const fallbackData = useMemo(() => {
    const map: Record<
      string,
      { price: number; change: number; changePercent: number; isPositive: boolean }
    > = {};
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
          ...e,
          price: liveQuote.price,
          change: liveQuote.change,
          changePercent: liveQuote.changePercent,
          isPositive: liveQuote.change >= 0,
          isLive: true,
        };
      }
      const fb = fallbackData[e.symbol];
      return {
        ...e,
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

  // Pinned items
  const pinnedItems = filtered.filter((e) => pinnedSymbols.includes(e.symbol));

  // Group remaining (non-pinned) by exchange
  const nonPinned = filtered.filter((e) => !pinnedSymbols.includes(e.symbol));
  const grouped = nonPinned.reduce(
    (acc, e) => {
      if (!acc[e.exchange]) acc[e.exchange] = [];
      acc[e.exchange].push(e);
      return acc;
    },
    {} as Record<string, typeof nonPinned>
  );

  const exchangeOrder = ["CRYPTO", "NASDAQ", "NYSE", "IDX"];
  const exchangeLabels: Record<string, string> = {
    CRYPTO: "Crypto",
    NASDAQ: "United States",
    NYSE: "United States",
    IDX: "Indonesia",
  };
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
          {/* Pinned section */}
          {pinnedItems.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-1.5 flex items-center gap-2">
                <Pin className="h-3 w-3 text-[hsl(var(--primary))]" />
                <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] font-medium">
                  Pinned
                </span>
                <span className="text-[9px] text-muted-foreground/60">
                  {pinnedItems.length}/5
                </span>
              </div>
              {pinnedItems.map((e) => (
                <EmitentRow
                  key={`pin-${e.symbol}`}
                  item={e}
                  isSelected={selected === e.symbol}
                  isPinned={true}
                  onSelect={onSelect}
                  onTogglePin={onTogglePin}
                  quotesLoading={quotesLoading}
                />
              ))}
              <div className="mx-4 my-1.5 border-b border-border" />
            </div>
          )}

          {/* Exchange groups */}
          {sortedExchanges.map((exchange) => (
            <div key={exchange} className="mb-2">
              <div className="px-4 py-1.5 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {exchange}
                </span>
                <span className="text-[9px] text-muted-foreground/60">
                  {exchangeLabels[exchange] || exchange}
                </span>
              </div>
              {grouped[exchange].map((e) => (
                <EmitentRow
                  key={e.symbol}
                  item={e}
                  isSelected={selected === e.symbol}
                  isPinned={false}
                  canPin={pinnedSymbols.length < 5}
                  onSelect={onSelect}
                  onTogglePin={onTogglePin}
                  quotesLoading={quotesLoading}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface EmitentRowProps {
  item: {
    symbol: string;
    name: string;
    currency: string;
    price: number;
    changePercent: number;
    isPositive: boolean;
    isLive: boolean;
  };
  isSelected: boolean;
  isPinned: boolean;
  canPin?: boolean;
  onSelect: (symbol: string) => void;
  onTogglePin: (symbol: string) => void;
  quotesLoading: boolean;
}

function EmitentRow({
  item,
  isSelected,
  isPinned,
  canPin = true,
  onSelect,
  onTogglePin,
  quotesLoading,
}: EmitentRowProps) {
  const currencySymbol = item.currency === "IDR" ? "Rp" : "$";
  const priceDisplay =
    item.currency === "IDR"
      ? `${currencySymbol}${item.price.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
      : `${currencySymbol}${item.price.toFixed(item.price < 1 ? 4 : 2)}`;

  return (
    <div
      className={cn(
        "group w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors cursor-pointer",
        "hover:bg-secondary/80",
        isSelected && "bg-secondary border-l-2 border-l-[hsl(var(--primary))]"
      )}
    >
      <button
        onClick={() => onSelect(item.symbol)}
        className="flex flex-col gap-0.5 flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground font-mono truncate">
            {item.symbol}
          </span>
          {item.isLive && <span className="h-1.5 w-1.5 rounded-full bg-[#26a65b] flex-shrink-0" />}
        </div>
        <span className="text-[10px] text-muted-foreground truncate max-w-[110px]">
          {item.name}
        </span>
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelect(item.symbol)}
          className="flex flex-col items-end gap-0.5"
        >
          <span className="text-xs font-mono text-foreground">
            {quotesLoading && !item.isLive ? (
              <span className="text-muted-foreground">---</span>
            ) : (
              priceDisplay
            )}
          </span>
          <span
            className={cn(
              "text-[10px] font-mono font-medium",
              item.isPositive ? "text-[#26a65b]" : "text-[#ef5350]"
            )}
          >
            {item.isPositive ? "+" : ""}
            {item.changePercent.toFixed(2)}%
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isPinned && !canPin) return;
            onTogglePin(item.symbol);
          }}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded transition-all flex-shrink-0",
            isPinned
              ? "text-[hsl(var(--primary))] hover:text-[#ef5350]"
              : "text-transparent group-hover:text-muted-foreground hover:text-foreground",
            !isPinned && !canPin && "group-hover:text-muted-foreground/30 cursor-not-allowed"
          )}
          title={isPinned ? "Unpin" : canPin ? "Pin to top" : "Max 5 pins"}
        >
          {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
