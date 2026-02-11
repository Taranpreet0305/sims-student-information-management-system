import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTransitionProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
}

export const AnimatedTransition = ({ show, children, className, fallback }: AnimatedTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className={className}
        >
          {children}
        </motion.div>
      ) : fallback ? (
        <motion.div
          key="fallback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={className}
        >
          {fallback}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default AnimatedTransition;
