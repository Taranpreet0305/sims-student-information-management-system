import { ReactNode } from "react";

interface AnimatedTransitionProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
}

export const AnimatedTransition = ({ show, children, className, fallback }: AnimatedTransitionProps) => {
  return (
    show ? (
      <div className={className}>
        {children}
      </div>
    ) : fallback ? (
      <div className={className}>
        {fallback}
      </div>
    ) : null
  );
};

export default AnimatedTransition;
