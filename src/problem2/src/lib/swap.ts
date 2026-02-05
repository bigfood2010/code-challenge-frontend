import type { TokenOption } from "@/types/token";

export interface SwapSelection {
  fromSymbol: string;
  toSymbol: string;
}

export interface SwapQuote {
  rate: number;
  receiveAmount: number;
}

const AMOUNT_PATTERN = /^[\d,]*\.?\d+$/;

export function isValidAmountInput(value: string): boolean {
  const trimmedValue = value.trim();
  if (!AMOUNT_PATTERN.test(trimmedValue)) return false;
  const stripped = trimmedValue.replace(/,/g, "");
  return !isNaN(parseFloat(stripped));
}

export function toPositiveAmount(value: string): number | null {
  const trimmedValue = value.trim();
  const stripped = trimmedValue.replace(/,/g, "");
  const amount = Number(stripped);

  if (isNaN(amount) || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export function findTokenBySymbol(
  tokens: TokenOption[],
  symbol: string,
): TokenOption | undefined {
  return tokens.find((token) => token.symbol === symbol);
}

export function getInitialSelection(
  tokens: TokenOption[],
  preferredFrom = "ETH",
  preferredTo = "SWTH",
): SwapSelection | null {
  if (tokens.length === 0) {
    return null;
  }

  const fromToken = findTokenBySymbol(tokens, preferredFrom) ?? tokens[0];
  const toToken =
    findTokenBySymbol(tokens, preferredTo) ??
    tokens.find((token) => token.symbol !== fromToken.symbol) ??
    fromToken;

  return {
    fromSymbol: fromToken.symbol,
    toSymbol: toToken.symbol,
  };
}

export function swapSelection(selection: SwapSelection): SwapSelection {
  if (!selection.fromSymbol || !selection.toSymbol) {
    return selection;
  }

  return {
    fromSymbol: selection.toSymbol,
    toSymbol: selection.fromSymbol,
  };
}

export function buildSwapQuote(
  amountInput: string,
  fromToken: TokenOption | undefined,
  toToken: TokenOption | undefined,
  isFromAmount = true,
): SwapQuote | null {
  if (!fromToken || !toToken || fromToken.symbol === toToken.symbol) {
    return null;
  }

  const amount = toPositiveAmount(amountInput);
  if (amount === null) {
    return null;
  }

  const rate = fromToken.price / toToken.price;

  if (!Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  const receiveAmount = isFromAmount ? amount * rate : amount;
  const sendAmount = isFromAmount ? amount : amount / rate;

  return {
    rate,
    receiveAmount,
    sendAmount,
  };
}

export interface SwapQuote {
  rate: number;
  receiveAmount: number;
  sendAmount: number;
}
