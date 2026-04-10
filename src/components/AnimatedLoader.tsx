interface AnimatedLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const AnimatedLoader = ({ size = "md", text }: AnimatedLoaderProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const dotSize = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-primary/20 border-t-primary animate-spin`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${dotSize[size]} rounded-full bg-primary`} />
        </div>
      </div>

      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

export const FullPageLoader = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-muted-foreground font-medium">{text}</p>
      </div>
    </div>
  );
};

export const SkeletonLoader = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`bg-muted/70 rounded-md ${className}`} />
  );
};

export default AnimatedLoader;
