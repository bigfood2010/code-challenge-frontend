import { motion, AnimatePresence } from "framer-motion";

interface FieldErrorProps {
  id: string;
  message?: string;
  className?: string;
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          id={id}
          role="alert"
          aria-live="polite"
          className={className}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
