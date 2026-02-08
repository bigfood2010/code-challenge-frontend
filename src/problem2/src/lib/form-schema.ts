import { z } from "zod";
import { isValidAmountInput, toPositiveAmount } from "@/lib/swap";

const ALPHABETIC_CHARACTER_PATTERN = /[A-Za-z]/;
const AMOUNT_ALLOWED_CHARACTER_PATTERN = /^[\d,.-]+$/;
const MAX_AMOUNT_LENGTH = 24;

function createAmountSchema() {
  return z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((val) => val.length <= MAX_AMOUNT_LENGTH, "Amount is too long")
    .refine((val) => !ALPHABETIC_CHARACTER_PATTERN.test(val), "Amount must be numeric")
    .refine(
      (val) => AMOUNT_ALLOWED_CHARACTER_PATTERN.test(val),
      "Use digits, commas, minus, or decimal point only",
    )
    .refine((val) => !val.includes("-"), "Negative amounts are not allowed")
    .refine((val) => isValidAmountInput(val), "Please enter a valid amount")
    .refine((val) => toPositiveAmount(val) !== null, "Amount must be greater than 0");
}

export const swapFormSchema = z.object({
  fromAmount: createAmountSchema(),
  toAmount: createAmountSchema(),
  fromSymbol: z.string().min(1, "Token selection required"),
  toSymbol: z.string().min(1, "Token selection required"),
});

export type SwapFormValues = z.infer<typeof swapFormSchema>;
