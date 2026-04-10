import { ReactNode } from "react";

interface StaggeredContentProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

interface StaggeredItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggeredContent = ({ children, className = "", delay = 0 }: StaggeredContentProps) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export const StaggeredItem = ({ children, className = "" }: StaggeredItemProps) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export const FadeIn = ({ children, className = "", delay = 0 }: StaggeredContentProps) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default StaggeredContent;
