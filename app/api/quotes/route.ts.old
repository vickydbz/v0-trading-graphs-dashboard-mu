import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "symbols param required" }, { status: 400 });
  }

  const symbolList = symbols.split(",").map((s) => s.trim());

  try {
    // Fetch quotes in parallel using Yahoo chart endpoint (1d range)
    const results = await Promise.allSettled(
      symbolList.map(async (symbol) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d&includePrePost=false`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          next: { revalidate: 30 },
        });

        if (!res.ok) return null;

        const json = await res.json();
        const meta = json.chart?.result?.[0]?.meta;
        if (!meta) return null;

        return {
          symbol: meta.symbol,
          price: meta.regularMarketPrice,
          previousClose: meta.previousClose ?? meta.chartPreviousClose,
          currency: meta.currency,
          exchange: meta.exchangeName,
        };
      })
    );

    const quotes: Record<string, {
      price: number;
      previousClose: number;
      change: number;
      changePercent: number;
      currency: string;
      exchange: string;
    }> = {};

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const q = result.value;
        const change = q.price - q.previousClose;
        const changePercent = q.previousClose ? (change / q.previousClose) * 100 : 0;
        quotes[q.symbol] = {
          price: q.price,
          previousClose: q.previousClose,
          change,
          changePercent,
          currency: q.currency,
          exchange: q.exchange,
        };
      }
    }

    return NextResponse.json({ quotes });
  } catch (err) {
    console.error("Quotes API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
