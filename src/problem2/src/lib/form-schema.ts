import { z } from "zod";
import { isValidAmountInput } from "@/lib/swap";

export const swapFormSchema = z.object({
  fromAmount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => isValidAmountInput(val), "Please enter a valid amount")
    .refine((val) => {
      const stripped = val.replace(/,/g, "");
      if (stripped === "." || stripped === "") return false;
      const num = parseFloat(stripped);
      return !isNaN(num) && num > 0;
    }, "Amount must be greater than 0"),
  toAmount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => isValidAmountInput(val), "Please enter a valid amount")
    .refine((val) => {
      const stripped = val.replace(/,/g, "");
      if (stripped === "." || stripped === "") return false;
      const num = parseFloat(stripped);
      return !isNaN(num) && num > 0;
    }, "Amount must be greater than 0"),
  fromSymbol: z.string().min(1, "Token selection required"),
  toSymbol: z.string().min(1, "Token selection required"),
});

export type SwapFormValues = z.infer<typeof swapFormSchema>;
