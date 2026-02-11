"use client";

import React from "react"

import { useMemo } from "react";
import type { OHLCData } from "@/lib/stock-data";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, BarChart, Clock } from "lucide-react";

interface MarketOverviewProps {
  data: OHLCData[];
  symbol: string;
  currency?: string;
}

export function MarketOverview({ data, symbol, currency = "USD" }: MarketOverviewProps) {
  const stats = useMemo(() => {
    if (data.length < 2) return null;
    const last = data[data.length - 1];
    const first = data[0];
    const high52 = Math.max(...data.map((d) => d.high));
    const low52 = Math.min(...data.map((d) => d.low));
    const avgVolume = Math.round(
      data.reduce((acc, d) => acc + d.volume, 0) / data.length
    );
    const totalChange = last.close - first.close;
    const totalChangePercent = (totalChange / first.close) * 100;

    return {
      high52,
      low52,
      avgVolume,
      totalChange,
      totalChangePercent,
      lastDate: last.time,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
    };
  }, [data]);

  if (!stats) return null;

  const isPositive = stats.totalChange >= 0;

  const formatPrice = (val: number) => {
    if (currency === "IDR") {
      return `Rp${val.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
    }
    return `$${val.toFixed(2)}`;
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Period Performance"
          value={`${isPositive ? "+" : ""}${stats.totalChangePercent.toFixed(2)}%`}
          icon={isPositive ? TrendingUp : TrendingDown}
          valueColor={isPositive ? "text-[#26a65b]" : "text-[#ef5350]"}
        />
        <StatCard
          label="52W Range"
          value={`${formatPrice(stats.low52)} - ${formatPrice(stats.high52)}`}
          icon={BarChart}
        />
        <StatCard
          label="Avg Volume"
          value={`${(stats.avgVolume / 1000000).toFixed(1)}M`}
          icon={BarChart}
        />
        <StatCard
          label="Last Updated"
          value={stats.lastDate}
          icon={Clock}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  valueColor,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn("text-sm font-mono font-semibold text-foreground", valueColor)}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
