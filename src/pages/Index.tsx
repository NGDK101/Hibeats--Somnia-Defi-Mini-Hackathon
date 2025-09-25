import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { CreatePage } from "@/components/pages/CreatePage";
import { ExplorePage } from "@/components/pages/ExplorePage";
import { PortfolioPage } from "@/components/pages/PortfolioPage";
import CreatorDetailPage from "@/components/pages/CreatorDetailPage";
import { SongDetailsPanel } from "@/components/details/SongDetailsPanel";
import { PlaylistSidebar } from "@/components/playlist/PlaylistSidebar";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { DynamicBackground } from "@/components/ui/dynamic-background-clean";
import { PageLoadingOverlay } from "@/components/ui/PageLoadingOverlay";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { TabSwitchLoading } from "@/components/ui/TabSwitchLoading";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { useProfile } from "@/hooks/useProfile";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { usePageTransition } from "@/hooks/usePageTransition";

// Profile-related imports
import ProfilePage from "@/components/profile/ProfilePage";
import ProfileSetup from "@/components/profile/ProfileSetup";

const Index = () => {
  const location = useLocation();
  const { username, creatorAddress } = useParams();
  const { userProfile, hasProfile } = useProfile();
  const [activeTab, setActiveTab] = useState("create");
  const [selectedSong, setSelectedSong] = useState(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState(true);
  const { currentSong, playlist, currentIndex, playNext, playPrevious, changeSong, isPlayerVisible, stopAudio } = useMusicPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Tab switching state
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [fromTab, setFromTab] = useState<string | undefined>();
  const [toTab, setToTab] = useState<string | undefined>();

  // Page transition hook
  const { isLoading: isPageLoading, startTransition, stopTransition } = usePageTransition(400);

  // Get forceRefreshAllData from context
  const { forceRefreshAllData } = useGeneratedMusicContext();

  // Callback to stop audio
  const handleStopAudio = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  // Make stopAudio function available globally for wallet disconnect handling
  useEffect(() => {
    (window as any).stopAudioPlayback = handleStopAudio;
    return () => {
      delete (window as any).stopAudioPlayback;
    };
  }, [handleStopAudio]);
  const [shouldStopAudio, setShouldStopAudio] = useState(false);
  
  // Add debouncing state
  const [isChangingTab, setIsChangingTab] = useState(false);
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced tab changing function with loading animation and debouncing
  const handleTabChange = useCallback(async (newTab: string) => {
    // Prevent multiple rapid tab changes
    if (newTab === activeTab || isChangingTab) return;

    setIsChangingTab(true);

    // Clear any existing timeout
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
    }

    try {
      // Start tab switching animation
      setIsTabSwitching(true);
      setFromTab(activeTab);
      setToTab(newTab);

      // Start page transition with proper error handling
      startTransition();
      
      // Small delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 200));
      setActiveTab(newTab);

      // End tab switching animation after content loads with safety timeout
      tabChangeTimeoutRef.current = setTimeout(() => {
        setIsTabSwitching(false);
        setFromTab(undefined);
        setToTab(undefined);
        setIsChangingTab(false);
        stopTransition(); // Ensure loading is stopped
      }, 800); // Increased timeout for safety

    } catch (error) {
      console.error('Tab change error:', error);
      // Reset states on error
      setIsTabSwitching(false);
      setFromTab(undefined);
      setToTab(undefined);
      setIsChangingTab(false);
      stopTransition();
    }
  }, [activeTab, isChangingTab, startTransition, stopTransition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
    };
  }, []);

  // Determine active tab based on route with loading transition - with debouncing
  useEffect(() => {
    const path = location.pathname;
    let newTab = "create"; // default

    if (path === '/explore') {
      newTab = "explore";
    } else if (path === '/create') {
      newTab = "create";
    } else if (path === '/portfolio') {
      newTab = "portfolio";
    } else if (path.startsWith('/profile')) {
      newTab = "profile";
    } else if (path === '/setup-profile') {
      newTab = "profile";
    } else if (path === '/playlist') {
      newTab = "portfolio";
    } else if (path === '/discover') {
      newTab = "explore";
    }

    // Only change tab if it's different and we're not already changing
    if (newTab !== activeTab && !isChangingTab) {
      handleTabChange(newTab);
    }
  }, [location.pathname, activeTab, isChangingTab, handleTabChange]);

  // Handle profile setup completion
  const handleProfileSetupComplete = () => {
    setActiveTab("profile");
  };

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    setIsDetailsPanelVisible(true);
    setShowPlaylistSidebar(false);
  };

  const handleCloseDetails = () => {
    setIsDetailsPanelVisible(false);
    setShowPlaylistSidebar(true);
  };

  const toggleToPlaylistSidebar = () => {
    setIsDetailsPanelVisible(false);
    setShowPlaylistSidebar(true);
  };

  const toggleToSongDetails = () => {
    if (selectedSong) {
      setIsDetailsPanelVisible(true);
      setShowPlaylistSidebar(false);
    }
  };

  // Make toggle functions available globally
  useEffect(() => {
    (window as any).toggleToPlaylistSidebar = toggleToPlaylistSidebar;
    (window as any).toggleToSongDetails = toggleToSongDetails;
    return () => {
      delete (window as any).toggleToPlaylistSidebar;
      delete (window as any).toggleToSongDetails;
    };
  }, [selectedSong]);

  // Special route handling
  if (location.pathname === '/setup-profile') {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  if (location.pathname.startsWith('/profile')) {
    if (username) {
      return <ProfilePage username={username} />;
    } else if (hasProfile && userProfile) {
      return <ProfilePage userAddress={userProfile.address} />;
    } else {
      return <ProfileSetup onComplete={handleProfileSetupComplete} />;
    }
  }

  if (location.pathname.startsWith('/creator')) {
    return <CreatorDetailPage />;
  }

  return (
    <div className="min-h-screen relative">
      {/* Tab switching loading overlay */}
      <TabSwitchLoading 
        isVisible={isTabSwitching}
        fromTab={fromTab}
        toTab={toTab}
      />

      {/* Main loading screen for initial page loads */}
      <LoadingScreen 
        isVisible={isPageLoading && !isTabSwitching}
        message={`Loading ${activeTab === 'create' ? 'Create Music' : activeTab === 'explore' ? 'Explore' : activeTab === 'portfolio' ? 'Portfolio' : 'Content'}...`}
        showProgress={false}
      />

      {/* Dynamic Background only for Create page */}
      {activeTab === "create" && (
        <DynamicBackground currentSong={currentSong} isPlaying={isPlaying} />
      )}
      
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavigationStart={() => {}}
        className=""
      />
      
      <main className={`w-full pb-8 relative z-10 ${isPlayerVisible ? 'pb-32' : ''}`}>
        <div className={`${
          isPlaying && currentSong && activeTab === "create" ? 'backdrop-blur-[0.5px]' : ''
        }`}>
          {/* Show skeleton during loading (but not during tab switching) */}
          {isPageLoading && !isTabSwitching && (
            <PageSkeleton type={activeTab as "create" | "explore" | "portfolio"} />
          )}

          {/* Render different pages with smooth transitions */}
          <PageTransition isLoading={isPageLoading || isTabSwitching}>
            {!isPageLoading && !isTabSwitching && activeTab === "explore" && (
              <ExplorePage />
            )}
            {!isPageLoading && !isTabSwitching && activeTab === "create" && (
              <CreatePage onSongSelect={handleSongSelect} />
            )}
            {!isPageLoading && !isTabSwitching && activeTab === "portfolio" && (
              <PortfolioPage onSongSelect={handleSongSelect} />
            )}
          </PageTransition>
        </div>
      </main>

      {/* Music Player - always visible */}
      <MusicPlayer 
        currentSong={currentSong}
        playlist={playlist}
        currentIndex={currentIndex}
        onNext={playNext}
        onPrevious={playPrevious}
        onSongChange={changeSong}
        onPlayingChange={setIsPlaying}
      />
    </div>
  );
};

export default Index;
