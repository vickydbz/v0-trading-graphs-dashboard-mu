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
        const time = date.toISOString().split("T")[0];

        return {
          time,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
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
