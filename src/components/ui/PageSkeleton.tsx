import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  type: "create" | "explore" | "portfolio";
  className?: string;
}

export const PageSkeleton = ({ type, className }: PageSkeletonProps) => {
  const renderCreateSkeleton = () => (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <div className="h-12 bg-white/10 rounded-lg w-96 mx-auto animate-pulse"></div>
        <div className="h-6 bg-white/10 rounded w-64 mx-auto animate-pulse"></div>
      </div>

      {/* Form skeleton */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-10 bg-white/10 rounded animate-pulse"></div>
        <div className="h-32 bg-white/10 rounded animate-pulse"></div>
        <div className="h-10 bg-white/10 rounded animate-pulse"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
            <div className="aspect-square bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExploreSkeleton = () => (
    <div className="space-y-6 p-6">
      {/* Search and filters skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 h-10 bg-white/10 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-white/10 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-white/10 rounded animate-pulse"></div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex space-x-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-white/10 rounded animate-pulse"></div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
            <div className="aspect-square bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPortfolioSkeleton = () => (
    <div className="space-y-6 p-6">
      {/* Profile header skeleton */}
      <div className="bg-white/10 rounded-lg p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-white/10 rounded w-32"></div>
            <div className="h-4 bg-white/10 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-lg p-4 text-center animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
            <div className="aspect-square bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case "create":
        return renderCreateSkeleton();
      case "explore":
        return renderExploreSkeleton();
      case "portfolio":
        return renderPortfolioSkeleton();
      default:
        return renderCreateSkeleton();
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-black via-gray-900 to-black", className)}>
      {renderSkeleton()}
    </div>
  );
};