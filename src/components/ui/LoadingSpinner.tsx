import { cn } from "@/lib/utils";
import loadLogo from "@/images/assets/load.png";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLogo?: boolean;
  message?: string;
}

export const LoadingSpinner = ({
  size = "md",
  className,
  showLogo = true,
  message
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {showLogo ? (
        <div className="relative">
          <img
            src={loadLogo}
            alt="Loading"
            className={cn(
              "object-contain animate-pulse loading-spin opacity-80",
              sizeClasses[size]
            )}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
            }}
          />
          {/* Subtle ring around logo */}
          <div className={cn(
            "absolute inset-0 border border-primary/30 rounded-full animate-ping",
            sizeClasses[size]
          )}></div>
        </div>
      ) : (
        <div className={cn(
          "border-2 border-white/20 border-t-primary rounded-full animate-spin",
          sizeClasses[size]
        )}></div>
      )}
      
      {message && (
        <p className="text-white/70 text-sm mt-2 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;