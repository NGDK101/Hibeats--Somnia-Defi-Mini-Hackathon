import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { GeneratePanel } from "@/components/generate/GeneratePanel";
import { LibraryPanel } from "@/components/library/LibraryPanel";
import { MusicPlayer } from "@/components/player/MusicPlayer";

const Index = () => {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Generate Panel */}
          <div className="space-y-6">
            <GeneratePanel />
          </div>
          
          {/* Library Panel */}
          <div className="space-y-6">
            <LibraryPanel />
          </div>
        </div>
      </main>

      <MusicPlayer />
    </div>
  );
};

export default Index;
