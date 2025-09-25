import { cn } from "@/lib/utils";
import loadLogo from "@/images/assets/load.png";

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingScreen = ({
  isVisible,
  message = "Loading...",
  className,
  showProgress = false,
  progress = 0
}: LoadingScreenProps) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center",
      "bg-gradient-to-br from-black via-gray-900 to-black",
      "transition-all duration-500 ease-in-out",
      className
    )}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full animate-ping animation-delay-0"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-blue-500/5 rounded-full animate-ping animation-delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-purple-500/5 rounded-full animate-ping animation-delay-2000"></div>
      </div>

      {/* Main loading content */}
      <div className="relative text-center z-10">
        {/* Logo with animations */}
        <div className="relative mb-6">
          {/* Main logo */}
          <div className="relative w-24 h-24 mx-auto">
            <img
              src={loadLogo}
              alt="HiBeats Loading"
              className="w-full h-full object-contain animate-pulse loading-logo"
            />
            
            {/* Rotating ring around logo */}
            <div className="absolute inset-0 border-2 border-transparent border-t-primary/60 border-r-blue-500/40 rounded-full animate-spin"></div>
            
            {/* Outer pulsing ring */}
            <div className="absolute -inset-2 border border-primary/20 rounded-full animate-ping"></div>
          </div>

          {/* Secondary animation elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border border-primary/10 rounded-full animate-pulse animation-delay-500"></div>
          </div>
        </div>

        {/* Loading Text with typewriter effect */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
            HiBeats
          </h2>
          <p className="text-white/70 text-sm font-medium animate-bounce">
            {message}
          </p>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Animated dots */}
        <div className="flex space-x-1 justify-center mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-0"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>

      {/* Music waves animation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-primary to-blue-400 rounded-full opacity-60 loading-wave"
            style={{
              height: '16px',
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;