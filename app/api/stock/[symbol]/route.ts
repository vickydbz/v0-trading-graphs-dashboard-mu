import { NextResponse } from "next/server";

interface YahooQuote {
  timestamp: number[];
  indicators: {
    quote: Array<{
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }>;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "1y";
  const interval = searchParams.get("interval") || "1d";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Yahoo Finance", status: res.status },
        { status: res.statusText === "Not Found" ? 404 : 502 }
      );
    }

    const json = await res.json();
    const result = json.chart?.result?.[0];

    if (!result) {
      return NextResponse.json(
        { error: "No data available for this symbol" },
        { status: 404 }
      );
    }

    const quote: YahooQuote = {
      timestamp: result.timestamp,
      indicators: result.indicators,
    };

    const meta = result.meta;
    const timestamps = quote.timestamp;
    const ohlcv = quote.indicators.quote[0];

    // Determine if this is intraday data
    const intradayIntervals = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"];
    const isIntraday = intradayIntervals.includes(interval);

    const seenTimes = new Set<string>();
    const data = timestamps
      .map((ts: number, i: number) => {
        const open = ohlcv.open[i];
        const high = ohlcv.high[i];
        const low = ohlcv.low[i];
        const close = ohlcv.close[i];
        const volume = ohlcv.volume[i];

        if (open == null || high == null || low == null || close == null) {
          return null;
        }

        const date = new Date(ts * 1000);
        // For intraday, use unix timestamp (lightweight-charts UTCTimestamp)
        // For daily+, use YYYY-MM-DD string
        const time = isIntraday ? ts : date.toISOString().split("T")[0];

        // Deduplicate
        const timeKey = String(time);
        if (seenTimes.has(timeKey)) return null;
        seenTimes.add(timeKey);

        return {
          time,
          open: parseFloat(open.toFixed(4)),
          high: parseFloat(high.toFixed(4)),
          low: parseFloat(low.toFixed(4)),
          close: parseFloat(close.toFixed(4)),
          volume: volume || 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      symbol: meta.symbol,
      currency: meta.currency,
      exchangeName: meta.exchangeName,
      regularMarketPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose ?? meta.chartPreviousClose,
      data,
    });
  } catch (err) {
    console.error("Stock API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
