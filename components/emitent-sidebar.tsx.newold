"use client";

import { EMITENTS } from "@/lib/stock-data";
import { ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

type Props = {
  selected: string;
  onSelect: (symbol: string) => void;
};

export function EmitentSidebar({ selected, onSelect }: Props) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="px-3 py-2 text-[10px] font-mono uppercase text-muted-foreground">
        Watchlist
      </div>

      <div className="flex-1 overflow-y-auto">
        {EMITENTS.map((e) => {
          const isActive = e.symbol === selected;

          // Placeholder signal (future-ready)
          // nanti akan diisi dari priceStats
          const mockChange = 0; // 0 = netral
          const isUp = mockChange > 0;
          const isDown = mockChange < 0;

          return (
            <button
              key={e.symbol}
              onClick={() => onSelect(e.symbol)}
              className={clsx(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors",
                "hover:bg-secondary",
                isActive && "bg-secondary font-semibold"
              )}
            >
              <div className="flex flex-col">
                <span className="font-mono">{e.symbol}</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {e.name}
                </span>
              </div>

              <div className="flex items-center gap-1 font-mono">
                {isUp && (
                  <ChevronUp className="h-3 w-3 text-green-500" />
                )}
                {isDown && (
                  <ChevronDown className="h-3 w-3 text-red-500" />
                )}
                {!isUp && !isDown && (
                  <span className="text-[10px] text-muted-foreground">
                    —
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2 text-[10px] text-muted-foreground font-mono">
        Click symbol to scan
      </div>
    </div>
  );
}
