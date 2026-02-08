import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowDownUp, RefreshCcw, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useTokenPrices } from "@/hooks/use-token-prices";
import type { SwapFormValues } from "@/lib/form-schema";
import { formatAmount } from "@/lib/format";
import {
  applyAmountInputChange,
  applyDirectionSwap,
  applySymbolChange,
  filterTokensBySearch,
  getSwapFormErrors,
  type FormErrorState,
  type SwapField,
} from "@/lib/swap-form-logic";
import { buildSwapQuote, findTokenBySymbol, getInitialSelection } from "@/lib/swap";
import styles from "@/components/organisms/currency-swap-form.module.css";
import { FieldError } from "@/components/atoms/field-error";
import { Toast } from "@/components/atoms/toast/toast";
import type { TokenOption } from "@/types/token";

type IconState = "loaded" | "failed";

export default function CurrencySwapForm() {
  const { tokens, loading, error: pricesError } = useTokenPrices();
  const [formValues, setFormValues] = useState<SwapFormValues>({
    fromAmount: "",
    toAmount: "",
    fromSymbol: "",
    toSymbol: "",
  });
  const [touchedFields, setTouchedFields] = useState<Partial<Record<SwapField, boolean>>>({});
  const [iconState, setIconState] = useState<Record<string, IconState>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const fromToken = useMemo(
    () => findTokenBySymbol(tokens, formValues.fromSymbol),
    [tokens, formValues.fromSymbol],
  );
  const toToken = useMemo(
    () => findTokenBySymbol(tokens, formValues.toSymbol),
    [tokens, formValues.toSymbol],
  );
  const searchResults = useMemo(
    () => (searchQuery.trim() ? filterTokensBySearch(tokens, searchQuery).slice(0, 8) : []),
    [tokens, searchQuery],
  );

  const quote = useMemo(
    () => buildSwapQuote(formValues.fromAmount, fromToken, toToken, true),
    [formValues.fromAmount, fromToken, toToken],
  );

  const validationErrors = useMemo(() => getSwapFormErrors(formValues), [formValues]);

  const visibleErrors = useMemo(() => {
    if (attemptedSubmit) {
      return validationErrors;
    }

    const nextErrors: FormErrorState = {};
    for (const key of Object.keys(validationErrors) as SwapField[]) {
      if (touchedFields[key]) {
        nextErrors[key] = validationErrors[key];
      }
    }

    return nextErrors;
  }, [attemptedSubmit, validationErrors, touchedFields]);

  const fromTokenOptions = tokens;
  const toTokenOptions = tokens;

  const isSubmitDisabled =
    loading ||
    isSubmitting ||
    Boolean(pricesError) ||
    Object.keys(validationErrors).length > 0 ||
    !quote;

  const prevSelection = useRef({
    fromSymbol: formValues.fromSymbol,
    toSymbol: formValues.toSymbol,
  });
  const searchOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const markTouched = (field: SwapField) => {
    setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const clearSubmitMessageIfNeeded = () => {
    setSubmitMessage((prev) => (prev ? null : prev));
  };

  const clearSearchState = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
    setHighlightedSearchIndex(-1);
  };

  const applyFromTokenFromSearch = (symbol: string) => {
    clearSubmitMessageIfNeeded();
    markTouched("fromSymbol");
    setFormValues((prev) =>
      applySymbolChange(
        prev,
        "fromSymbol",
        symbol,
        tokens,
        findTokenBySymbol(tokens, prev.fromSymbol),
        findTokenBySymbol(tokens, prev.toSymbol),
      ),
    );
    clearSearchState();
  };

  const markIconLoaded = (symbol: string) => {
    setIconState((prev) => (prev[symbol] === "loaded" ? prev : { ...prev, [symbol]: "loaded" }));
  };

  const markIconFailed = (symbol: string) => {
    setIconState((prev) => (prev[symbol] === "failed" ? prev : { ...prev, [symbol]: "failed" }));
  };

  const renderTokenIcon = (token: TokenOption | undefined) => {
    if (!token) {
      return <span className={styles.iconFallback}>--</span>;
    }

    const state = iconState[token.symbol];
    const isFailed = state === "failed";
    const isLoaded = state === "loaded";

    return (
      <span className={styles.iconFrame} aria-hidden="true">
        {!isFailed && (
          <img
            src={token.iconUrl}
            className={`${styles.icon} ${isLoaded ? styles.iconVisible : styles.iconHidden}`}
            alt={`${token.symbol} token icon`}
            loading="lazy"
            onLoad={() => markIconLoaded(token.symbol)}
            onError={() => markIconFailed(token.symbol)}
          />
        )}

        {!isLoaded && !isFailed && <span className={styles.iconSkeleton} />}
        {isFailed && <span className={styles.iconFallback}>{token.symbol.slice(0, 2)}</span>}
      </span>
    );
  };

  useEffect(() => {
    if (!loading && tokens.length > 0 && !formValues.fromSymbol && !formValues.toSymbol) {
      const initialSelection = getInitialSelection(tokens, "ETH", "SWTH");
      if (!initialSelection) {
        return;
      }

      // Initial token values are derived from async price payload.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormValues((prev) => ({
        ...prev,
        fromSymbol: initialSelection.fromSymbol,
        toSymbol: initialSelection.toSymbol,
      }));
    }
  }, [loading, tokens, formValues.fromSymbol, formValues.toSymbol]);

  useEffect(() => {
    const { fromSymbol, toSymbol } = formValues;

    if (fromSymbol && toSymbol && fromSymbol === toSymbol) {
      setFormValues((prev) => {
        if (prev.fromSymbol !== prev.toSymbol) {
          return prev;
        }

        if (
          prev.fromSymbol !== prevSelection.current.fromSymbol &&
          prevSelection.current.fromSymbol
        ) {
          return {
            ...prev,
            toSymbol: prevSelection.current.fromSymbol,
          };
        }

        if (
          prev.toSymbol !== prevSelection.current.toSymbol &&
          prevSelection.current.toSymbol
        ) {
          return {
            ...prev,
            fromSymbol: prevSelection.current.toSymbol,
          };
        }

        return prev;
      });
    }

    prevSelection.current = { fromSymbol, toSymbol };
  }, [formValues]);

  useEffect(() => {
    if (!isSearchOpen || highlightedSearchIndex < 0) {
      return;
    }

    const activeOption = searchOptionRefs.current[highlightedSearchIndex];
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [highlightedSearchIndex, isSearchOpen, searchResults.length]);

  const handleFromAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearSubmitMessageIfNeeded();

    setFormValues((prev) =>
      applyAmountInputChange(prev, "fromAmount", event.target.value, fromToken, toToken),
    );
  };

  const handleToAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearSubmitMessageIfNeeded();

    setFormValues((prev) =>
      applyAmountInputChange(prev, "toAmount", event.target.value, fromToken, toToken),
    );
  };

  const handleFromTokenChange = (event: ChangeEvent<HTMLSelectElement>) => {
    clearSubmitMessageIfNeeded();

    setFormValues((prev) =>
      applySymbolChange(
        prev,
        "fromSymbol",
        event.target.value,
        tokens,
        fromToken,
        toToken,
      ),
    );
  };

  const handleToTokenChange = (event: ChangeEvent<HTMLSelectElement>) => {
    clearSubmitMessageIfNeeded();

    setFormValues((prev) =>
      applySymbolChange(
        prev,
        "toSymbol",
        event.target.value,
        tokens,
        fromToken,
        toToken,
      ),
    );
  };

  const handleSwapDirection = () => {
    clearSubmitMessageIfNeeded();

    setFormValues((prev) => applyDirectionSwap(prev));

    setTouchedFields((prev) => ({
      ...prev,
      fromSymbol: true,
      toSymbol: true,
      fromAmount: true,
      toAmount: true,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (Object.keys(validationErrors).length > 0 || !quote) {
      return;
    }

    setSubmitMessage(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitMessage("Swap transaction confirmed.");
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value.toUpperCase();
    setSearchQuery(nextQuery);
    setIsSearchOpen(Boolean(nextQuery));
    setHighlightedSearchIndex(0);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || !searchQuery.trim()) {
      if (event.key === "Escape") {
        clearSearchState();
      }
      return;
    }

    if (!searchResults.length) {
      if (event.key === "Escape") {
        clearSearchState();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsSearchOpen(true);
      setHighlightedSearchIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, searchResults.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedSearchIndex((prev) =>
        prev <= 0 ? 0 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const activeIndex = highlightedSearchIndex < 0 ? 0 : highlightedSearchIndex;
      const selectedToken = searchResults[activeIndex];
      if (selectedToken) {
        applyFromTokenFromSearch(selectedToken.symbol);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearSearchState();
    }
  };

  return (
    <>
      <Toast
        message={submitMessage}
        isVisible={Boolean(submitMessage)}
        onClose={() => setSubmitMessage(null)}
      />

      <motion.section
        className={styles.panel}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Swap Assets</h1>
          </div>
          <div className={styles.statusBox}>
            <div className={`${styles.statusDot} ${loading ? styles.statusDotLoading : ""}`} />
            <span className={styles.statusText}>{loading ? "Syncing..." : "Live"}</span>
          </div>
        </header>

        <div className={styles.tokenSearchPanel}>
          <label htmlFor="token-search" className={styles.tokenSearchLabel}>
            Quick token search
          </label>
          <div className={styles.tokenSearchInputWrap}>
            <Search size={16} aria-hidden="true" className={styles.tokenSearchIcon} />
            <input
              id="token-search"
              name="tokenSearch"
              className={styles.tokenSearchInput}
              type="text"
              placeholder="Type currency symbol..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchOpen(Boolean(searchQuery))}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsSearchOpen(false);
                  setHighlightedSearchIndex(-1);
                }, 100);
              }}
              onKeyDown={handleSearchKeyDown}
              autoComplete="off"
              spellCheck={false}
              aria-autocomplete="list"
              aria-expanded={isSearchOpen}
              aria-controls="token-search-results"
            />
          </div>

          {isSearchOpen && searchQuery && (
            <ul id="token-search-results" className={styles.tokenSearchResults} role="listbox">
              {searchResults.length ? (
                searchResults.map((token, index) => (
                  <li key={token.symbol} role="option" aria-selected={highlightedSearchIndex === index}>
                    <button
                      type="button"
                      ref={(element) => {
                        searchOptionRefs.current[index] = element;
                      }}
                      className={`${styles.tokenSearchOption} ${
                        highlightedSearchIndex === index ? styles.tokenSearchOptionActive : ""
                      }`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        applyFromTokenFromSearch(token.symbol);
                      }}
                    >
                      {token.symbol}
                    </button>
                  </li>
                ))
              ) : (
                <li className={styles.tokenSearchEmpty}>No matching token</li>
              )}
            </ul>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <div className={styles.label}>
              <span>Amount to send</span>
            </div>
            <div className={styles.inputWrap}>
              <input
                type="text"
                placeholder="0.00"
                className={styles.input}
                id="from-amount"
                name="fromAmount"
                value={formValues.fromAmount}
                onChange={handleFromAmountChange}
                onBlur={() => markTouched("fromAmount")}
                aria-invalid={Boolean(visibleErrors.fromAmount)}
                disabled={loading || Boolean(pricesError)}
                inputMode="decimal"
                autoComplete="off"
              />

              <div className={styles.selectWrap}>
                {loading ? (
                  <RefreshCcw className={styles.spin} size={16} aria-hidden="true" />
                ) : (
                  renderTokenIcon(fromToken)
                )}

                <select
                  className={styles.select}
                  id="from-symbol"
                  name="fromSymbol"
                  value={formValues.fromSymbol}
                  onChange={handleFromTokenChange}
                  onBlur={() => markTouched("fromSymbol")}
                  disabled={loading || fromTokenOptions.length === 0}
                  aria-invalid={Boolean(visibleErrors.fromSymbol)}
                >
                  {!formValues.fromSymbol && <option value="">Select token</option>}
                  {fromTokenOptions.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <FieldError
              id="from-amount-error"
              message={visibleErrors.fromAmount ?? visibleErrors.fromSymbol}
              className={styles.error}
            />
          </div>

          <div className={styles.divider}>
            <button type="button" className={styles.swapAction} onClick={handleSwapDirection}>
              <ArrowDownUp size={18} />
            </button>
          </div>

          <div className={`${styles.field} ${styles.receiveField}`}>
            <div className={styles.label}>
              <span>Amount to receive</span>
            </div>
            <div className={styles.inputWrap}>
              <input
                type="text"
                placeholder="0.00"
                className={styles.input}
                id="to-amount"
                name="toAmount"
                value={formValues.toAmount}
                onChange={handleToAmountChange}
                onBlur={() => markTouched("toAmount")}
                aria-invalid={Boolean(visibleErrors.toAmount)}
                disabled={loading || Boolean(pricesError)}
                inputMode="decimal"
                autoComplete="off"
              />

              <div className={styles.selectWrap}>
                {loading ? (
                  <RefreshCcw className={styles.spin} size={16} aria-hidden="true" />
                ) : (
                  renderTokenIcon(toToken)
                )}

                <select
                  className={styles.select}
                  id="to-symbol"
                  name="toSymbol"
                  value={formValues.toSymbol}
                  onChange={handleToTokenChange}
                  onBlur={() => markTouched("toSymbol")}
                  disabled={loading || toTokenOptions.length === 0}
                  aria-invalid={Boolean(visibleErrors.toSymbol)}
                >
                  {!formValues.toSymbol && <option value="">Select token</option>}
                  {toTokenOptions.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.quoteCard}>
            {loading ? (
              <p className={styles.inlineInfo}>Fetching latest token prices...</p>
            ) : (
              <div className={styles.quoteRow}>
                <span className={styles.quoteLabel}>Exchange Rate</span>
                <span className={styles.quoteValue}>
                  {quote
                    ? `1 ${formValues.fromSymbol} = ${formatAmount(quote.rate, 8)} ${formValues.toSymbol}`
                    : ""}
                </span>
              </div>
            )}
          </div>

          {pricesError && <p className={styles.formError}>{pricesError}</p>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitDisabled}>
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.btnContent}
                >
                  <RefreshCcw className={styles.spin} size={20} />
                  <span>Processing...</span>
                </motion.div>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Confirm Swap
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>
      </motion.section>
    </>
  );
}
