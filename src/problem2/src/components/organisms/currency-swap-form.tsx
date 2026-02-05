import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowDownUp, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useTokenPrices } from "@/hooks/use-token-prices";
import { swapFormSchema, type SwapFormValues } from "@/lib/form-schema";
import { formatAmount } from "@/lib/format";
import {
  buildSwapQuote,
  findTokenBySymbol,
  getInitialSelection,
  swapSelection,
} from "@/lib/swap";
import styles from "@/components/organisms/currency-swap-form.module.css";
import { FieldError } from "@/components/atoms/field-error";
import { Toast } from "@/components/atoms/toast/toast";

export default function CurrencySwapForm() {
  const { tokens, loading, error: pricesError } = useTokenPrices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting: rhfSubmitting },
  } = useForm<SwapFormValues>({
    resolver: zodResolver(swapFormSchema),
    mode: "onChange",
    defaultValues: {
      fromAmount: "",
      toAmount: "",
      fromSymbol: "",
      toSymbol: "",
    },
  });

  const [fromAmount = "", toAmount = "", fromSymbol = "", toSymbol = ""] = useWatch({
    control,
    name: ["fromAmount", "toAmount", "fromSymbol", "toSymbol"],
  });

  const fromToken = useMemo(
    () => findTokenBySymbol(tokens, fromSymbol),
    [tokens, fromSymbol],
  );
  const toToken = useMemo(
    () => findTokenBySymbol(tokens, toSymbol),
    [tokens, toSymbol],
  );

  const quote = useMemo(() => {
    // We prioritize the send amount for the exchange rate display
    return buildSwapQuote(fromAmount, fromToken, toToken, true);
  }, [fromAmount, fromToken, toToken]);

  const isSubmitDisabled =
    loading ||
    isSubmitting ||
    rhfSubmitting ||
    Boolean(pricesError) ||
    Boolean(errors.fromAmount || errors.toAmount || errors.fromSymbol || errors.toSymbol) ||
    !quote;

  const prevSelection = useRef({ fromSymbol, toSymbol });

  // Sync logic when tokens change (re-calculate the receive amount based on send amount)
  useEffect(() => {
    if (fromSymbol && toSymbol && fromToken && toToken) {
      const q = buildSwapQuote(fromAmount, fromToken, toToken, true);
      if (q) {
        setValue("toAmount", formatAmount(q.receiveAmount), { shouldValidate: true });
      }
    }
  }, [fromSymbol, toSymbol, fromToken, toToken, fromAmount, setValue]);

  // Handle same-currency selection (Swap instead of blocking)
  useEffect(() => {
    if (fromSymbol && toSymbol && fromSymbol === toSymbol) {
      if (fromSymbol !== prevSelection.current.fromSymbol) {
        setValue("toSymbol", prevSelection.current.fromSymbol, {
          shouldValidate: true,
        });
      } else if (toSymbol !== prevSelection.current.toSymbol) {
        setValue("fromSymbol", prevSelection.current.toSymbol, {
          shouldValidate: true,
        });
      }
    }
    prevSelection.current = { fromSymbol, toSymbol };
  }, [fromSymbol, toSymbol, setValue]);

  // Initial selection
  useEffect(() => {
    if (!loading && tokens.length > 0 && !fromSymbol && !toSymbol) {
      const initialSelection = getInitialSelection(tokens, "ETH", "SWTH");
      if (!initialSelection) return;
      setValue("fromSymbol", initialSelection.fromSymbol, { shouldValidate: true });
      setValue("toSymbol", initialSelection.toSymbol, { shouldValidate: true });
    }
  }, [loading, tokens, fromSymbol, toSymbol, setValue]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmitMessage(null);
  }, [fromSymbol, toSymbol, fromAmount, toAmount]);

  const handleSwapDirection = useCallback(() => {
    const nextSelection = swapSelection({ fromSymbol, toSymbol });
    setValue("fromSymbol", nextSelection.fromSymbol, { shouldValidate: true });
    setValue("toSymbol", nextSelection.toSymbol, { shouldValidate: true });
    // Also swap amounts if they exist
    const currentFrom = fromAmount;
    const currentTo = toAmount;
    setValue("fromAmount", currentTo, { shouldValidate: true });
    setValue("toAmount", currentFrom, { shouldValidate: true });
  }, [fromSymbol, toSymbol, fromAmount, toAmount, setValue]);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const q = buildSwapQuote(val, fromToken, toToken, true);
    if (q) {
      setValue("toAmount", formatAmount(q.receiveAmount), { shouldValidate: true });
    } else if (!val) {
      setValue("toAmount", "");
    }
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const q = buildSwapQuote(val, fromToken, toToken, false);
    if (q) {
      setValue("fromAmount", formatAmount(q.sendAmount), { shouldValidate: true });
    } else if (!val) {
      setValue("fromAmount", "");
    }
  };

  const onSubmit = async () => {
    if (!quote) return;
    setSubmitMessage(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitMessage("Swap transaction confirmed.");
  };

  return (
    <>
      <Toast 
        message={submitMessage} 
        isVisible={!!submitMessage} 
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
            <div className={styles.statusDot} />
            <span className={styles.statusText}>{loading ? "Syncing..." : "Live"}</span>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          {/* PAY FIELD */}
          <div className={styles.field}>
            <div className={styles.label}>
              <span>Amount to send</span>
            </div>
            <div className={styles.inputWrap}>
              <input
                type="text"
                placeholder="0.00"
                className={styles.input}
                {...register("fromAmount", { onChange: handleFromAmountChange })}
              />
              <div className={styles.selectWrap}>
                {fromToken && <img src={fromToken.iconUrl} className={styles.icon} alt="" />}
                <select className={styles.select} {...register("fromSymbol")}>
                  {tokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                  ))}
                </select>
              </div>
            </div>
            <FieldError id="from-amount-error" message={errors.fromAmount?.message} className={styles.error} />
          </div>

          <div className={styles.divider}>
            <button type="button" className={styles.swapAction} onClick={handleSwapDirection}>
              <ArrowDownUp size={18} />
            </button>
          </div>

          {/* RECEIVE FIELD */}
          <div className={`${styles.field} ${styles.receiveField}`}>
            <div className={styles.label}>
              <span>Amount to receive</span>
            </div>
            <div className={styles.inputWrap}>
              <input
                type="text"
                placeholder="0.00"
                className={styles.input}
                {...register("toAmount", { onChange: handleToAmountChange })}
              />
              <div className={styles.selectWrap}>
                {toToken && <img src={toToken.iconUrl} className={styles.icon} alt="" />}
                <select className={styles.select} {...register("toSymbol")}>
                  {tokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                  ))}
                </select>
              </div>
            </div>
            <FieldError id="to-amount-error" message={errors.toAmount?.message} className={styles.error} />
          </div>

          <div className={styles.quoteCard}>
            <div className={styles.quoteRow}>
              <span className={styles.quoteLabel}>Exchange Rate</span>
              <span className={styles.quoteValue}>
                {quote ? `1 ${fromSymbol} = ${formatAmount(quote.rate, 8)} ${toSymbol}` : "---"}
              </span>
            </div>
          </div>

          {pricesError && (
             <p className={styles.formError}>{pricesError}</p>
          )}

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
                  <RefreshCcw className="animate-spin" size={20} />
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
