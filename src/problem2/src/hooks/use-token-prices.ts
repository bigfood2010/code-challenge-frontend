import { useEffect, useState } from "react";

import { fetchTokenOptions } from "@/services/prices-api";
import type { TokenOption } from "@/types/token";

interface UseTokenPricesResult {
  tokens: TokenOption[];
  loading: boolean;
  error: string | null;
}

export function useTokenPrices(): UseTokenPricesResult {
  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const nextTokens = await fetchTokenOptions(controller.signal);
        setTokens(nextTokens);
      } catch (unknownError) {
        if ((unknownError as Error).name === "AbortError") {
          return;
        }

        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Failed to load prices",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();

    return () => controller.abort();
  }, []);

  return { tokens, loading, error };
}
