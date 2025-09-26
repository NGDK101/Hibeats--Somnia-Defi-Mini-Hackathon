import React, { useState, useEffect } from 'react';
import {
  SkeletonNavbar,
  SkeletonWalletConnect,
  SkeletonMusicCard,
  SkeletonProfileHeader,
  SkeletonPageContent,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonText,
  SkeletonNavItem
} from '@/components/ui/SkeletonLoader';

/**
 * Example component showing OpenSea-style skeleton loading patterns
 * This demonstrates the correct usage of skeleton components
 */
export const SkeletonExample = () => {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    // Simulate loading time like OpenSea
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Full navbar skeleton */}
        <SkeletonNavbar />

        <div className="container mx-auto px-6 py-8">
          {/* Profile header skeleton */}
          <SkeletonProfileHeader />

          <div className="mt-8">
            {/* Page content skeleton */}
            <SkeletonPageContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Skeleton Loading Examples</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Individual skeleton components */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Individual Components</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-400 mb-2">Avatar Skeleton</h3>
                <div className="flex space-x-2">
                  <SkeletonAvatar size="sm" />
                  <SkeletonAvatar size="md" />
                  <SkeletonAvatar size="lg" />
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-2">Button Skeleton</h3>
                <div className="flex space-x-2">
                  <SkeletonButton width="w-20" />
                  <SkeletonButton width="w-32" />
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-2">Text Skeleton</h3>
                <div className="space-y-2">
                  <SkeletonText width="w-48" height="h-6" />
                  <SkeletonText width="w-32" height="h-4" />
                  <SkeletonText width="w-64" height="h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-2">Navigation Items</h3>
                <div className="flex space-x-2">
                  <SkeletonNavItem />
                  <SkeletonNavItem />
                  <SkeletonNavItem />
                </div>
              </div>
            </div>
          </div>

          {/* Composite components */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Composite Components</h2>

            <div>
              <h3 className="text-sm text-gray-400 mb-2">Wallet Connect</h3>
              <SkeletonWalletConnect />
            </div>

            <div>
              <h3 className="text-sm text-gray-400 mb-2">Music Card</h3>
              <SkeletonMusicCard />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setShowSkeleton(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Show Skeleton Again
          </button>
        </div>
      </div>
    </div>
  );
};