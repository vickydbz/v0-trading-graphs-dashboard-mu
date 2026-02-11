"use client";

import clsx from "clsx";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "1d";

type Props = {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;

  // OPTIONAL: jaga kompatibilitas kalau sebelumnya ada props lain
  chartType?: string;
  onChartTypeChange?: (type: string) => void;
  indicators?: string[];
  onToggleIndicator?: (indicator: string) => void;
};

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "1d"];

export function ChartControls({
  timeframe,
  onTimeframeChange,
}: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
      {/* Left: Timeframe */}
      <div className="flex items-center gap-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={clsx(
              "h-7 rounded px-2 text-xs font-mono transition-colors",
              tf === timeframe
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Right: Hint / future controls */}
      <div className="text-[10px] font-mono text-muted-foreground">
        Day trade preset
      </div>
    </div>
  );
}
