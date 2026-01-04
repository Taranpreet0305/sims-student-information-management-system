import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: "blur(4px)",
  },
  in: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  out: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
  },
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 25,
        mass: 0.5,
      }}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
