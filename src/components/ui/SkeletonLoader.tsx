import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'pulse' | 'shimmer';
}

export const Skeleton = ({ className, variant = 'pulse' }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        variant === 'pulse' && "animate-pulse",
        variant === 'shimmer' && "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
        className
      )}
    />
  );
};

// OpenSea-style skeleton components
export const SkeletonAvatar = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  return (
    <Skeleton
      className={cn(
        "rounded-full bg-white/10 border-2 border-white/20",
        sizeClasses[size]
      )}
    />
  );
};

export const SkeletonButton = ({
  width = "auto",
  height = "h-10",
  className
}: {
  width?: string;
  height?: string;
  className?: string;
}) => {
  return (
    <Skeleton
      className={cn(
        "bg-white/10 border border-white/20 rounded-full px-4 py-2",
        height,
        width !== "auto" && width,
        className
      )}
    />
  );
};

export const SkeletonText = ({
  width = "w-20",
  height = "h-4",
  className
}: {
  width?: string;
  height?: string;
  className?: string;
}) => {
  return (
    <Skeleton
      className={cn(
        "bg-white/10 rounded",
        width,
        height,
        className
      )}
    />
  );
};

export const SkeletonNavItem = ({ className }: { className?: string }) => {
  return (
    <Skeleton
      className={cn(
        "bg-white/10 rounded-full w-16 h-8",
        className
      )}
    />
  );
};

// Composite skeleton for wallet connect area
export const SkeletonWalletConnect = () => {
  return (
    <div className="flex items-center space-x-3">
      {/* Wallet info skeleton */}
      <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
        <SkeletonText width="w-24" height="h-4" />
      </div>

      {/* Avatar skeleton */}
      <SkeletonAvatar size="md" />
    </div>
  );
};

// Composite skeleton for navigation
export const SkeletonNavigation = () => {
  return (
    <div className="flex items-center space-x-6">
      <SkeletonNavItem className="w-12" />
      <SkeletonNavItem className="w-16" />
      <SkeletonNavItem className="w-14" />
      <SkeletonNavItem className="w-18" />
    </div>
  );
};

// Composite skeleton for entire navbar
export const SkeletonNavbar = () => {
  return (
    <div className="flex items-center justify-between w-full px-6 py-4">
      {/* Left side - Logo + Navigation */}
      <div className="flex items-center space-x-8">
        {/* Logo skeleton */}
        <div className="flex items-center space-x-2">
          <SkeletonAvatar size="sm" />
          <SkeletonText width="w-20" height="h-6" />
        </div>

        {/* Navigation skeleton */}
        <SkeletonNavigation />
      </div>

      {/* Right side - Wallet Connect */}
      <SkeletonWalletConnect />
    </div>
  );
};

// Skeleton for music cards/content
export const SkeletonMusicCard = () => {
  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-4">
      {/* Image skeleton */}
      <Skeleton className="w-full h-48 rounded-lg bg-white/10" />

      {/* Title skeleton */}
      <SkeletonText width="w-3/4" height="h-5" />

      {/* Creator skeleton */}
      <div className="flex items-center space-x-2">
        <SkeletonAvatar size="sm" />
        <SkeletonText width="w-1/2" height="h-4" />
      </div>

      {/* Stats skeleton */}
      <div className="flex justify-between">
        <SkeletonText width="w-16" height="h-4" />
        <SkeletonText width="w-20" height="h-4" />
      </div>
    </div>
  );
};

// Skeleton for profile header
export const SkeletonProfileHeader = () => {
  return (
    <div className="space-y-6">
      {/* Cover image skeleton */}
      <Skeleton className="w-full h-32 rounded-lg bg-white/10" />

      {/* Profile info skeleton */}
      <div className="flex items-center space-x-4">
        <SkeletonAvatar size="lg" />
        <div className="space-y-2">
          <SkeletonText width="w-32" height="h-6" />
          <SkeletonText width="w-48" height="h-4" />
          <div className="flex space-x-4">
            <SkeletonText width="w-16" height="h-4" />
            <SkeletonText width="w-16" height="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for page content
export const SkeletonPageContent = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <SkeletonText width="w-48" height="h-8" />
        <SkeletonText width="w-full" height="h-4" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonMusicCard key={i} />
        ))}
      </div>
    </div>
  );
};