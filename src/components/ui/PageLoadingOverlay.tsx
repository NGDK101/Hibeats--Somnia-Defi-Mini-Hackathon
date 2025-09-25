import { cn } from "@/lib/utils";

interface PageLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export const PageLoadingOverlay = ({
  isVisible,
  message = "Loading...",
  className
}: PageLoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black/80 backdrop-blur-sm",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mx-auto"></div>

          {/* Pulse effect */}
          <div className="absolute inset-0 w-12 h-12 border-4 border-primary/30 rounded-full animate-ping mx-auto"></div>
        </div>

        {/* Loading Text */}
        <p className="text-white/80 text-sm font-medium animate-pulse">
          {message}
        </p>

        {/* Progress bar */}
        <div className="w-32 h-1 bg-white/10 rounded-full mt-4 mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};