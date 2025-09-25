import { cn } from "@/lib/utils";
import loadLogo from "@/images/assets/load.png";

interface TabSwitchLoadingProps {
  isVisible: boolean;
  fromTab?: string;
  toTab?: string;
  className?: string;
}

export const TabSwitchLoading = ({
  isVisible,
  fromTab,
  toTab,
  className
}: TabSwitchLoadingProps) => {
  if (!isVisible) return null;

  const getTabDisplayName = (tab: string) => {
    switch (tab) {
      case 'create': return 'Create Music';
      case 'explore': return 'Explore';
      case 'portfolio': return 'Portfolio';
      case 'profile': return 'Profile';
      case 'discover': return 'Discover';
      case 'playlist': return 'Playlist';
      default: return 'Loading';
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-40 flex items-center justify-center",
      "bg-black/60 backdrop-blur-md",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      <div className="text-center relative">
        {/* Logo with smooth rotation */}
        <div className="relative mb-4">
          <div className="w-16 h-16 mx-auto relative">
            <img
              src={loadLogo}
              alt="HiBeats"
              className="w-full h-full object-contain loading-spin"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))'
              }}
            />
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
          </div>
        </div>

        {/* Tab transition text */}
        <div className="space-y-2">
          {fromTab && toTab && (
            <p className="text-white/60 text-xs font-medium">
              {getTabDisplayName(fromTab)} → {getTabDisplayName(toTab)}
            </p>
          )}
          
          <p className="text-white/80 text-sm font-medium animate-pulse">
            {toTab ? `Loading ${getTabDisplayName(toTab)}...` : 'Switching...'}
          </p>
        </div>

        {/* Minimal progress indicator */}
        <div className="w-24 h-0.5 bg-white/10 rounded-full mt-4 mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default TabSwitchLoading;