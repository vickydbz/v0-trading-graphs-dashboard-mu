import useSWR from "swr";
import type { OHLCData } from "@/lib/stock-data";

interface StockResponse {
  symbol: string;
  currency: string;
  exchangeName: string;
  regularMarketPrice: number;
  previousClose: number;
  data: OHLCData[];
}

interface QuotesResponse {
  quotes: Record<
    string,
    {
      price: number;
      previousClose: number;
      change: number;
      changePercent: number;
      currency: string;
      exchange: string;
    }
  >;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch stock data");
    throw error;
  }
  return res.json();
};

export function useStockData(symbol: string, range = "1y", interval = "1d") {
  const { data, error, isLoading, isValidating } = useSWR<StockResponse>(
    `/api/stock/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
    fetcher,
    {
      refreshInterval: 30000, // refresh every 30s
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      keepPreviousData: true,
    }
  );

  return {
    stockData: data?.data ?? null,
    livePrice: data?.regularMarketPrice ?? null,
    previousClose: data?.previousClose ?? null,
    currency: data?.currency ?? null,
    exchangeName: data?.exchangeName ?? null,
    isLoading,
    isValidating,
    isError: !!error,
  };
}

export function useQuotes(symbols: string[]) {
  const symbolsParam = symbols.join(",");
  const { data, error, isLoading } = useSWR<QuotesResponse>(
    symbols.length > 0 ? `/api/quotes?symbols=${encodeURIComponent(symbolsParam)}` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  );

  return {
    quotes: data?.quotes ?? {},
    isLoading,
    isError: !!error,
  };
}
