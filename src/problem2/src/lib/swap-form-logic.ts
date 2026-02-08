import { swapFormSchema, type SwapFormValues } from "@/lib/form-schema";
import { formatAmount } from "@/lib/format";
import { buildSwapQuote, findTokenBySymbol, swapSelection } from "@/lib/swap";
import type { TokenOption } from "@/types/token";

export type SwapField = keyof SwapFormValues;
export type FormErrorState = Partial<Record<SwapField, string>>;

type AmountField = "fromAmount" | "toAmount";
type SymbolField = "fromSymbol" | "toSymbol";

const MAX_AMOUNT_INPUT_LENGTH = 24;

function getLinkedAmount(
  amount: string,
  fromToken: TokenOption | undefined,
  toToken: TokenOption | undefined,
  isFromAmount: boolean,
): string {
  const quote = buildSwapQuote(amount, fromToken, toToken, isFromAmount);

  if (!amount || !quote) {
    return "";
  }

  return formatAmount(isFromAmount ? quote.receiveAmount : quote.sendAmount);
}

function normalizeAmountInput(rawValue: string): string {
  const compactValue = rawValue.replace(/\s+/g, "");
  return compactValue.slice(0, MAX_AMOUNT_INPUT_LENGTH);
}

export function getSwapFormErrors(values: SwapFormValues): FormErrorState {
  const parsed = swapFormSchema.safeParse(values);
  const nextErrors: FormErrorState = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key !== "string") {
        continue;
      }

      const typedKey = key as SwapField;
      if (!nextErrors[typedKey]) {
        nextErrors[typedKey] = issue.message;
      }
    }
  }

  if (values.fromSymbol && values.toSymbol && values.fromSymbol === values.toSymbol) {
    nextErrors.toSymbol ??= "Please choose a different receive token";
  }

  return nextErrors;
}

export function filterTokensBySearch(tokens: TokenOption[], searchQuery: string): TokenOption[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return tokens;
  }

  return tokens.filter((token) => token.symbol.toLowerCase().includes(normalizedQuery));
}

export function ensureSelectedTokenIncluded(
  allTokens: TokenOption[],
  filteredTokens: TokenOption[],
  selectedSymbol: string,
): TokenOption[] {
  if (!selectedSymbol || filteredTokens.some((token) => token.symbol === selectedSymbol)) {
    return filteredTokens;
  }

  const selectedToken = findTokenBySymbol(allTokens, selectedSymbol);
  return selectedToken ? [selectedToken, ...filteredTokens] : filteredTokens;
}

export function applyAmountInputChange(
  currentValues: SwapFormValues,
  field: AmountField,
  rawValue: string,
  fromToken: TokenOption | undefined,
  toToken: TokenOption | undefined,
): SwapFormValues {
  const nextAmount = normalizeAmountInput(rawValue);

  if (field === "fromAmount") {
    return {
      ...currentValues,
      fromAmount: nextAmount,
      toAmount: getLinkedAmount(nextAmount, fromToken, toToken, true),
    };
  }

  return {
    ...currentValues,
    toAmount: nextAmount,
    fromAmount: getLinkedAmount(nextAmount, fromToken, toToken, false),
  };
}

export function applySymbolChange(
  currentValues: SwapFormValues,
  field: SymbolField,
  nextSymbol: string,
  allTokens: TokenOption[],
  fromToken: TokenOption | undefined,
  toToken: TokenOption | undefined,
): SwapFormValues {
  if (field === "fromSymbol") {
    const nextFromToken = findTokenBySymbol(allTokens, nextSymbol);

    return {
      ...currentValues,
      fromSymbol: nextSymbol,
      toAmount: getLinkedAmount(currentValues.fromAmount, nextFromToken, toToken, true),
    };
  }

  const nextToToken = findTokenBySymbol(allTokens, nextSymbol);

  return {
    ...currentValues,
    toSymbol: nextSymbol,
    toAmount: getLinkedAmount(currentValues.fromAmount, fromToken, nextToToken, true),
  };
}

export function applyDirectionSwap(currentValues: SwapFormValues): SwapFormValues {
  const nextSelection = swapSelection({
    fromSymbol: currentValues.fromSymbol,
    toSymbol: currentValues.toSymbol,
  });

  return {
    ...currentValues,
    fromSymbol: nextSelection.fromSymbol,
    toSymbol: nextSelection.toSymbol,
    fromAmount: currentValues.toAmount,
    toAmount: currentValues.fromAmount,
  };
}
