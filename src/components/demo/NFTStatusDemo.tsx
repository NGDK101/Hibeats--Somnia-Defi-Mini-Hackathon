import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSongStatus } from '@/hooks/useSongStatus';
import { useNFTManager, getStatusText, getStatusColor } from '@/hooks/useNFTManager';
import NFTActionButtons from '@/components/ui/NFTActionButtons';
import NFTGrid from '@/components/ui/NFTGrid';

// Demo component untuk testing NFT status system
export function NFTStatusDemo() {
  const [testTrackId, setTestTrackId] = useState('');
  const [activeTab, setActiveTab] = useState('single');

  // Mock data untuk testing
  const mockSongs = [
    {
      aiTrackId: 'test-song-1',
      title: 'AI Symphony No. 1',
      artist: 'AI Composer',
      imageUrl: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Music+1',
      genre: 'Classical',
      duration: 180,
    },
    {
      aiTrackId: 'test-song-2', 
      title: 'Electronic Dreams',
      artist: 'Digital Creator',
      imageUrl: 'https://via.placeholder.com/400x400/f093fb/ffffff?text=Music+2',
      genre: 'Electronic',
      duration: 240,
    },
    {
      aiTrackId: 'test-song-3',
      title: 'Jazz Fusion Experiment', 
      artist: 'AI Jazz Band',
      imageUrl: 'https://via.placeholder.com/400x400/4facfe/ffffff?text=Music+3',
      genre: 'Jazz',
      duration: 320,
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>NFT Status Management Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="single">Single Song Test</TabsTrigger>
              <TabsTrigger value="grid">NFT Grid Demo</TabsTrigger>
              <TabsTrigger value="actions">Action Buttons Demo</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Test AI Track ID
                  </label>
                  <Input
                    value={testTrackId}
                    onChange={(e) => setTestTrackId(e.target.value)}
                    placeholder="Enter AI Track ID to test..."
                  />
                </div>
                
                {testTrackId && (
                  <SingleSongStatusTest trackId={testTrackId} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="grid">
              <div>
                <h3 className="text-lg font-semibold mb-4">NFT Grid Component</h3>
                <NFTGrid 
                  songs={mockSongs}
                  loading={false}
                  emptyMessage="No test songs available"
                />
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <h3 className="text-lg font-semibold">Action Buttons for Each Mock Song</h3>
              <div className="grid gap-4">
                {mockSongs.map((song) => (
                  <Card key={song.aiTrackId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{song.title}</h4>
                          <p className="text-sm text-gray-600">{song.artist}</p>
                        </div>
                        <NFTActionButtons 
                          aiTrackId={song.aiTrackId}
                          songData={song}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Component untuk test single song status
function SingleSongStatusTest({ trackId }: { trackId: string }) {
  const songStatus = useSongStatus(trackId);
  const nftManager = useNFTManager();

  if (songStatus.loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">Loading status...</div>
        </CardContent>
      </Card>
    );
  }

  if (songStatus.error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-red-600">
            Error: {songStatus.error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Status Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge className={getStatusColor(songStatus.status)}>
                  {getStatusText(songStatus.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Is Minted:</span>
                <span>{songStatus.isMinted ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Is Listed:</span>
                <span>{songStatus.isListed ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Is Owner:</span>
                <span>{songStatus.isOwner ? '✅ Yes' : '❌ No'}</span>
              </div>
              {songStatus.tokenId && (
                <div className="flex justify-between">
                  <span>Token ID:</span>
                  <span>#{songStatus.tokenId.toString()}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Available Actions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Can Mint:</span>
                <span>{songStatus.canMint ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Can List:</span>
                <span>{songStatus.canList ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Can Unlist:</span>
                <span>{songStatus.canUnlist ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Can Update:</span>
                <span>{songStatus.canUpdate ? '✅ Yes' : '❌ No'}</span>
              </div>
            </div>
          </div>
        </div>

        {songStatus.listingData && (
          <div>
            <h4 className="font-medium mb-2">Listing Data</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(songStatus.listingData, null, 2)}
            </pre>
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Action Buttons</h4>
          <NFTActionButtons 
            aiTrackId={trackId}
            songData={{
              title: `Test Song ${trackId}`,
              artist: 'Test Artist',
            }}
          />
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={songStatus.refetch}
            variant="outline"
            size="sm"
            disabled={songStatus.loading}
          >
            🔄 Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NFTStatusDemo;