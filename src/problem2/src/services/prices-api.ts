import type { PriceRow, TokenOption } from "@/types/token";

const PRICES_URL = "https://interview.switcheo.com/prices.json";
const ICON_BASE_URL = "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

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
  return new Date(left).getTime() > new Date(right).getTime();
}

export async function fetchTokenOptions(signal?: AbortSignal): Promise<TokenOption[]> {
  const response = await fetch(PRICES_URL, { signal });

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

    const current = latestBySymbol.get(item.currency);

    if (!current || isMoreRecentDate(item.date, current.date)) {
      latestBySymbol.set(item.currency, item);
    }
  }

  return Array.from(latestBySymbol.values())
    .map((item) => ({
      symbol: item.currency,
      price: item.price,
      updatedAt: item.date,
      iconUrl: `${ICON_BASE_URL}/${item.currency}.svg`,
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}
