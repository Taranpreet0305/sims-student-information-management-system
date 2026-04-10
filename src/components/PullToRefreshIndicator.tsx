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
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
      style={{ 
        transform: `translateX(-50%) translateY(${Math.min(pullDistance * 0.3, 30)}px)` 
      }}
    >
      <div
        className="bg-primary/10 backdrop-blur-sm rounded-full p-3 shadow-lg border border-primary/20"
        style={{ transform: `scale(${isRefreshing ? 1 : 0.8 + progress * 0.2})` }}
      >
        <RefreshCw 
          className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""} ${
            progress >= 1 || isRefreshing 
              ? "text-primary" 
              : "text-muted-foreground"
          }`}
        />
      </div>
      {pullDistance > 20 && !isRefreshing && (
        <span className="absolute top-full mt-1 text-xs text-muted-foreground whitespace-nowrap">
          {progress >= 1 ? "Release to refresh" : "Pull to refresh"}
        </span>
      )}
    </div>
  );
};
