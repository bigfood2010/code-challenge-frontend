import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import styles from './toast.module.css';

interface ToastProps {
  message: string | null;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && message && (
          <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={styles.toast}>
              <div className={styles.iconWrapper}>
                <CheckCircle2 size={20} />
              </div>
              <span className={styles.message}>{message}</span>
              <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
};
