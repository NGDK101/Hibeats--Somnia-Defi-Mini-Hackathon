import { cn } from "@/lib/utils";
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonText,
  SkeletonMusicCard,
  SkeletonProfileHeader,
} from "@/components/ui/SkeletonLoader";

interface PageSkeletonProps {
  type: "create" | "explore" | "portfolio" | "profile" | "creator" | "playlist" | "setup";
  className?: string;
}

export const PageSkeleton = ({ type, className }: PageSkeletonProps) => {
  const renderCreateSkeleton = () => (
    <div className="space-y-8 p-6">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <SkeletonText width="w-96" height="h-12" className="mx-auto" />
        <SkeletonText width="w-64" height="h-6" className="mx-auto" />
      </div>

      {/* Create form skeleton */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Input fields */}
        <div className="space-y-4">
          <SkeletonText width="w-full" height="h-12" />
          <Skeleton className="w-full h-32 rounded-lg bg-white/10" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonButton width="w-full" height="h-12" />
            <SkeletonButton width="w-full" height="h-12" />
          </div>
        </div>

        {/* Generate button skeleton */}
        <div className="flex justify-center">
          <SkeletonButton width="w-48" height="h-14" />
        </div>
      </div>

      {/* Recent creations grid */}
      <div className="space-y-4">
        <SkeletonText width="w-48" height="h-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonMusicCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderExploreSkeleton = () => (
    <div className="space-y-8 p-6">
      {/* Header and search skeleton */}
      <div className="space-y-6">
        <div className="text-center">
          <SkeletonText width="w-64" height="h-10" className="mx-auto" />
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <SkeletonButton width="flex-1" height="h-12" />
          <SkeletonButton width="w-32" height="h-12" />
          <SkeletonButton width="w-32" height="h-12" />
        </div>
      </div>

      {/* Category tabs skeleton */}
      <div className="flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <SkeletonButton key={i} width="w-20" height="h-10" />
        ))}
      </div>

      {/* Featured section skeleton */}
      <div className="space-y-4">
        <SkeletonText width="w-32" height="h-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-6 space-y-4">
              <Skeleton className="w-full h-48 rounded-lg bg-white/10" />
              <SkeletonText width="w-3/4" height="h-6" />
              <div className="flex items-center space-x-2">
                <SkeletonAvatar size="sm" />
                <SkeletonText width="w-1/2" height="h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Music grid skeleton */}
      <div className="space-y-4">
        <SkeletonText width="w-40" height="h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <SkeletonMusicCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPortfolioSkeleton = () => (
    <div className="space-y-8 p-6">
      {/* Profile header skeleton */}
      <SkeletonProfileHeader />

      {/* Portfolio tabs skeleton */}
      <div className="flex space-x-1 bg-white/5 rounded-full p-1">
        {[...Array(4)].map((_, i) => (
          <SkeletonButton key={i} width="flex-1" height="h-10" />
        ))}
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-6 text-center space-y-2">
            <SkeletonText width="w-16" height="h-8" className="mx-auto" />
            <SkeletonText width="w-20" height="h-4" className="mx-auto" />
          </div>
        ))}
      </div>

      {/* Portfolio content skeleton */}
      <div className="space-y-6">
        <SkeletonText width="w-32" height="h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonMusicCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfileSkeleton = () => (
    <div className="space-y-8 p-6">
      {/* Profile banner skeleton */}
      <div className="relative">
        <Skeleton className="w-full h-64 rounded-lg bg-white/10" />
        <div className="absolute bottom-6 left-6">
          <SkeletonAvatar size="lg" />
        </div>
      </div>

      {/* Profile info skeleton */}
      <div className="space-y-4 pl-6">
        <SkeletonText width="w-48" height="h-8" />
        <SkeletonText width="w-96" height="h-5" />
        <div className="flex space-x-6">
          <SkeletonText width="w-20" height="h-4" />
          <SkeletonText width="w-24" height="h-4" />
          <SkeletonText width="w-16" height="h-4" />
        </div>
      </div>

      {/* Profile tabs skeleton */}
      <div className="flex space-x-1 bg-white/5 rounded-full p-1">
        {[...Array(3)].map((_, i) => (
          <SkeletonButton key={i} width="flex-1" height="h-10" />
        ))}
      </div>

      {/* Profile content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(12)].map((_, i) => (
          <SkeletonMusicCard key={i} />
        ))}
      </div>
    </div>
  );

  const renderCreatorSkeleton = () => (
    <div className="space-y-8 p-6">
      {/* Creator header skeleton */}
      <div className="text-center space-y-4">
        <SkeletonAvatar size="lg" className="mx-auto" />
        <SkeletonText width="w-48" height="h-8" className="mx-auto" />
        <SkeletonText width="w-64" height="h-5" className="mx-auto" />
      </div>

      {/* Creator stats skeleton */}
      <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <SkeletonText width="w-12" height="h-8" className="mx-auto" />
            <SkeletonText width="w-16" height="h-4" className="mx-auto" />
          </div>
        ))}
      </div>

      {/* Creator content skeleton */}
      <div className="space-y-6">
        <SkeletonText width="w-40" height="h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonMusicCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPlaylistSkeleton = () => (
    <div className="space-y-8 p-6">
      {/* Playlist header skeleton */}
      <div className="flex items-start space-x-6">
        <Skeleton className="w-48 h-48 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-4">
          <SkeletonText width="w-16" height="h-4" />
          <SkeletonText width="w-64" height="h-10" />
          <SkeletonText width="w-96" height="h-5" />
          <div className="flex space-x-4">
            <SkeletonButton width="w-24" height="h-10" />
            <SkeletonButton width="w-20" height="h-10" />
          </div>
        </div>
      </div>

      {/* Playlist tracks skeleton */}
      <div className="space-y-4">
        <SkeletonText width="w-32" height="h-8" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-white/5">
              <SkeletonText width="w-8" height="h-4" />
              <Skeleton className="w-12 h-12 rounded bg-white/10" />
              <div className="flex-1 space-y-1">
                <SkeletonText width="w-48" height="h-4" />
                <SkeletonText width="w-32" height="h-3" />
              </div>
              <SkeletonText width="w-12" height="h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSetupSkeleton = () => (
    <div className="space-y-8 p-6 max-w-2xl mx-auto">
      {/* Setup header skeleton */}
      <div className="text-center space-y-4">
        <SkeletonText width="w-64" height="h-10" className="mx-auto" />
        <SkeletonText width="w-96" height="h-5" className="mx-auto" />
      </div>

      {/* Setup form skeleton */}
      <div className="space-y-6">
        {/* Avatar upload skeleton */}
        <div className="text-center space-y-4">
          <SkeletonAvatar size="lg" className="mx-auto" />
          <SkeletonButton width="w-32" height="h-10" className="mx-auto" />
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-4">
          <SkeletonText width="w-full" height="h-12" />
          <SkeletonText width="w-full" height="h-12" />
          <Skeleton className="w-full h-24 rounded-lg bg-white/10" />
          <SkeletonText width="w-full" height="h-12" />
        </div>

        {/* Submit button skeleton */}
        <SkeletonButton width="w-full" height="h-12" />
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
      case "profile":
        return renderProfileSkeleton();
      case "creator":
        return renderCreatorSkeleton();
      case "playlist":
        return renderPlaylistSkeleton();
      case "setup":
        return renderSetupSkeleton();
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