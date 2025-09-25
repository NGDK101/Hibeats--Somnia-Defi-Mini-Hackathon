import React from 'react';
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
}

export const PageTransition = ({ children, isLoading, className }: PageTransitionProps) => {
  return (
    <div
      className={cn(
        "transition-all duration-500 ease-in-out",
        isLoading
          ? "opacity-0 scale-95 blur-sm"
          : "opacity-100 scale-100 blur-none",
        className
      )}
    >
      {children}
    </div>
  );
};