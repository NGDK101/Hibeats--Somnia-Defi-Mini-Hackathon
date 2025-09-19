import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { CreatePage } from "@/components/pages/CreatePage";
import { LibraryPage } from "@/components/pages/LibraryPage";
import { ExplorePage } from "@/components/pages/ExplorePage";
import { PortfolioPage } from "@/components/pages/PortfolioPage";
import { SongDetailsPanel } from "@/components/details/SongDetailsPanel";
import { PlaylistSidebar } from "@/components/playlist/PlaylistSidebar";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { DynamicBackground } from "@/components/ui/dynamic-background-clean";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { useProfile } from "@/hooks/useProfile";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";

// Profile-related imports
import ProfilePage from "@/components/profile/ProfilePage";
import ProfileSetup from "@/components/profile/ProfileSetup";
import DebugPage from "@/components/pages/DebugPage";

const Index = () => {
  const location = useLocation();
  const { username } = useParams();
  const { profile, hasProfile } = useProfile();
  const [activeTab, setActiveTab] = useState("create");
  const [selectedSong, setSelectedSong] = useState(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState(true);
  const { currentSong, playlist, currentIndex, playNext, playPrevious, changeSong, isPlayerVisible, stopAudio } = useMusicPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Determine active tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/profile')) {
      setActiveTab("profile");
    } else if (path === '/setup-profile') {
      setActiveTab("profile");
    } else if (path === '/debug') {
      setActiveTab("debug");
    } else {
      // Default based on current activeTab or "create"
      setActiveTab(prev => prev || "create");
    }
  }, [location.pathname]);

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
    } else if (hasProfile && profile) {
      return <ProfilePage userAddress={profile.address} />;
    } else {
      return <ProfileSetup onComplete={handleProfileSetupComplete} />;
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Dynamic Background only for Create page */}
      {activeTab === "create" && (
        <DynamicBackground currentSong={currentSong} isPlaying={isPlaying} />
      )}
      
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        className=""
      />
      
      <main className={`w-full pb-8 relative z-10 ${isPlayerVisible ? 'pb-32' : ''}`}>
        <div className={`transition-all duration-300 ${
          isPlaying && currentSong && activeTab === "create" ? 'backdrop-blur-[0.5px]' : ''
        }`}>
          {/* Render different pages based on activeTab */}
          {activeTab === "explore" && (
            <ExplorePage onSongSelect={handleSongSelect} />
          )}
          {activeTab === "create" && (
            <CreatePage onSongSelect={handleSongSelect} />
          )}
          {activeTab === "library" && (
            <LibraryPage onSongSelect={handleSongSelect} />
          )}
          {activeTab === "portfolio" && (
            <PortfolioPage onSongSelect={handleSongSelect} />
          )}
          {activeTab === "debug" && (
            <DebugPage />
          )}
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
