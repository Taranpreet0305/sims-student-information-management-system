import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  threshold,
  isRefreshing,
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10 || isRefreshing;

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: shouldShow ? 1 : 0, 
        y: shouldShow ? 0 : -20 
      }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
      style={{ 
        transform: `translateX(-50%) translateY(${Math.min(pullDistance * 0.3, 30)}px)` 
      }}
    >
      <motion.div
        className="bg-primary/10 backdrop-blur-sm rounded-full p-3 shadow-lg border border-primary/20"
        animate={{
          scale: isRefreshing ? 1 : 0.8 + progress * 0.2,
        }}
      >
        <motion.div
          animate={{
            rotate: isRefreshing ? 360 : progress * 180,
          }}
          transition={{
            rotate: isRefreshing 
              ? { duration: 1, repeat: Infinity, ease: "linear" }
              : { duration: 0 }
          }}
        >
          <RefreshCw 
            className={`w-5 h-5 ${
              progress >= 1 || isRefreshing 
                ? "text-primary" 
                : "text-muted-foreground"
            }`}
          />
        </motion.div>
      </motion.div>
      {pullDistance > 20 && !isRefreshing && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full mt-1 text-xs text-muted-foreground whitespace-nowrap"
        >
          {progress >= 1 ? "Release to refresh" : "Pull to refresh"}
        </motion.span>
      )}
    </motion.div>
  );
};
