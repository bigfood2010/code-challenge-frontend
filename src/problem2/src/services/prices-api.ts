import type { PriceRow, TokenOption } from "@/types/token";

const PRICES_URL = "https://interview.switcheo.com/prices.json";
const ICON_BASE_URL = "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";
const REQUEST_TIMEOUT_MS = 8000;
const SYMBOL_PATTERN = /^[A-Z0-9-]+$/;

function isValidPriceRow(input: unknown): input is PriceRow {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const row = input as Partial<PriceRow>;

  return (
    typeof row.currency === "string" &&
    typeof row.date === "string" &&
    typeof row.price === "number" &&
    Number.isFinite(row.price) &&
    row.price > 0
  );
}

function isMoreRecentDate(left: string, right: string): boolean {
  return Date.parse(left) > Date.parse(right);
}

function normalizeSymbol(rawSymbol: string): string | null {
  const normalized = rawSymbol.trim().toUpperCase();
  if (!normalized || !SYMBOL_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function buildIconUrl(symbol: string): string {
  return `${ICON_BASE_URL}/${encodeURIComponent(symbol)}.svg`;
}

async function fetchWithTimeout(url: string, signal?: AbortSignal): Promise<Response> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  const abortByParentSignal = () => timeoutController.abort();
  signal?.addEventListener("abort", abortByParentSignal);

  try {
    return await fetch(url, { signal: timeoutController.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError" && !signal?.aborted) {
      throw new Error("Token prices request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortByParentSignal);
  }
}

export async function fetchTokenOptions(signal?: AbortSignal): Promise<TokenOption[]> {
  const response = await fetchWithTimeout(PRICES_URL, signal);

  if (!response.ok) {
    throw new Error("Failed to fetch token prices");
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("Unexpected prices response");
  }

  const latestBySymbol = new Map<string, PriceRow>();

  for (const item of payload) {
    if (!isValidPriceRow(item)) {
      continue;
    }

    const normalizedSymbol = normalizeSymbol(item.currency);
    if (!normalizedSymbol) {
      continue;
    }

    const normalizedPriceRow: PriceRow = {
      ...item,
      currency: normalizedSymbol,
    };

    const current = latestBySymbol.get(normalizedSymbol);

    if (!current || isMoreRecentDate(normalizedPriceRow.date, current.date)) {
      latestBySymbol.set(normalizedSymbol, normalizedPriceRow);
    }
  }

  return Array.from(latestBySymbol.values())
    .map((item) => ({
      symbol: item.currency,
      price: item.price,
      updatedAt: item.date,
      iconUrl: buildIconUrl(item.currency),
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}
