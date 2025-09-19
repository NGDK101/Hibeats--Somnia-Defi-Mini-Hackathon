import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, CheckCircle, XCircle, AlertCircle, Coins, List, X, DollarSign } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useNFTManager } from '@/hooks/useNFTManager';
import { useSongStatus } from '@/hooks/useSongStatus';
import { toast } from 'sonner';

export function UniversalNFTTest() {
  const { address } = useAccount();
  const nftManager = useNFTManager();

  // Test data
  const [testTrackId, setTestTrackId] = useState(`test_track_${Date.now()}`);
  const [testPrice, setTestPrice] = useState('0.01');
  const [newPrice, setNewPrice] = useState('0.02');
  const [isTestingMint, setIsTestingMint] = useState(false);
  const [isTestingList, setIsTestingList] = useState(false);
  const [isTestingUnlist, setIsTestingUnlist] = useState(false);
  const [isTestingUpdate, setIsTestingUpdate] = useState(false);

  // Get song status
  const songStatus = useSongStatus(testTrackId);

  // Test mint (should work for ANY user)
  const testMint = async () => {
    if (!address) {
      toast.error('Please connect wallet first');
      return;
    }

    setIsTestingMint(true);
    try {
      console.log('🎵 Testing Universal Mint - ANY USER CAN MINT');

      await nftManager.handleAction('mint', {
        aiTrackId: testTrackId,
        songData: {
          title: `Universal Test Track ${Date.now()}`,
          artist: `User ${address.slice(0, 6)}`,
          imageUrl: 'https://via.placeholder.com/300x300?text=Test+NFT',
          audioUrl: 'https://www.soundjay.com/misc/sounds/camera-click-04.mp3',
          genre: 'Test',
          duration: 30,
          prompt: 'Test prompt for universal minting',
          modelUsed: 'V4',
          taskId: testTrackId,
          createdAt: new Date().toISOString(),
        }
      });

      toast.success('✅ Universal Mint SUCCESS! ANY user can mint!');
      await songStatus.refetch();
    } catch (error) {
      console.error('❌ Universal Mint FAILED:', error);
      toast.error(`Mint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingMint(false);
    }
  };

  // Test list (should work for ANY user, not just owner)
  const testList = async () => {
    if (!address || !songStatus.tokenId) {
      toast.error('Need wallet and minted NFT');
      return;
    }

    setIsTestingList(true);
    try {
      console.log('📝 Testing Universal List - ANY USER CAN LIST');

      await nftManager.handleAction('list', {
        aiTrackId: testTrackId,
        tokenId: songStatus.tokenId,
        price: testPrice,
        duration: 2592000, // 30 days
        category: 'Music',
        tags: ['test', 'universal', 'nft'],
      });

      toast.success('✅ Universal List SUCCESS! ANY user can list!');
      await songStatus.refetch();
    } catch (error) {
      console.error('❌ Universal List FAILED:', error);
      toast.error(`List failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingList(false);
    }
  };

  // Test unlist (should work for ANY user, not just owner)
  const testUnlist = async () => {
    if (!address || !songStatus.tokenId) {
      toast.error('Need wallet and minted NFT');
      return;
    }

    setIsTestingUnlist(true);
    try {
      console.log('❌ Testing Universal Unlist - ANY USER CAN UNLIST');

      await nftManager.handleAction('unlist', {
        aiTrackId: testTrackId,
        tokenId: songStatus.tokenId,
      });

      toast.success('✅ Universal Unlist SUCCESS! ANY user can unlist!');
      await songStatus.refetch();
    } catch (error) {
      console.error('❌ Universal Unlist FAILED:', error);
      toast.error(`Unlist failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingUnlist(false);
    }
  };

  // Test update price (should work for ANY user, not just owner)
  const testUpdatePrice = async () => {
    if (!address || !songStatus.tokenId) {
      toast.error('Need wallet and minted NFT');
      return;
    }

    setIsTestingUpdate(true);
    try {
      console.log('💰 Testing Universal Update Price - ANY USER CAN UPDATE');

      await nftManager.handleAction('update', {
        aiTrackId: testTrackId,
        tokenId: songStatus.tokenId,
        newPrice: newPrice,
      });

      toast.success('✅ Universal Update SUCCESS! ANY user can update price!');
      await songStatus.refetch();
    } catch (error) {
      console.error('❌ Universal Update FAILED:', error);
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingUpdate(false);
    }
  };

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (available: boolean, text: string) => {
    return (
      <Badge variant={available ? "default" : "secondary"} className="flex items-center gap-1">
        {getStatusIcon(available)}
        {text}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Universal NFT Access Test
        </CardTitle>
        <CardDescription>
          Verify that ANY user can mint, list, unlist, and update NFTs without ownership restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Current Status */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Current Test Status</h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Wallet Connected</span>
              <Badge variant={address ? "default" : "secondary"}>
                {address ? '✅ Connected' : '❌ Not Connected'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Test Track Status</span>
              <Badge variant={songStatus.isMinted ? "default" : "secondary"}>
                {songStatus.isMinted ? '✅ Minted' : '⏳ Not Minted'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Listing Status</span>
              <Badge variant={songStatus.isListed ? "default" : "secondary"}>
                {songStatus.isListed ? '📝 Listed' : '📋 Not Listed'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Ownership Status</span>
              <Badge variant={songStatus.isOwner ? "default" : "outline"}>
                {songStatus.isOwner ? '👑 Owner' : '👤 Non-Owner'}
              </Badge>
            </div>
          </div>

          {songStatus.tokenId && (
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              <strong>Token ID:</strong> {songStatus.tokenId.toString()}
            </div>
          )}
        </div>

        {/* Test Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Test Configuration</h4>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="trackId" className="text-xs">Test Track ID</Label>
              <Input
                id="trackId"
                value={testTrackId}
                onChange={(e) => setTestTrackId(e.target.value)}
                className="text-sm"
                placeholder="test_track_123"
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-xs">List Price (STT)</Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                value={testPrice}
                onChange={(e) => setTestPrice(e.target.value)}
                className="text-sm"
                placeholder="0.01"
              />
            </div>
            <div>
              <Label htmlFor="newPrice" className="text-xs">New Price (STT)</Label>
              <Input
                id="newPrice"
                type="number"
                step="0.001"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="text-sm"
                placeholder="0.02"
              />
            </div>
          </div>
        </div>

        {/* Universal Access Tests */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Universal Access Tests</h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Mint Test */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">1. Universal Mint</h5>
                {getStatusBadge(true, 'Available to ALL')}
              </div>
              <p className="text-xs text-muted-foreground">
                ANY user should be able to mint NFTs using Factory contract (no authorization required)
              </p>
              <Button
                onClick={testMint}
                disabled={isTestingMint || !address || songStatus.isMinted}
                className="w-full"
                size="sm"
              >
                {isTestingMint ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Mint...
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Test Universal Mint
                  </>
                )}
              </Button>
            </div>

            {/* List Test */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">2. Universal List</h5>
                {getStatusBadge(true, 'Available to ALL')}
              </div>
              <p className="text-xs text-muted-foreground">
                ANY user should be able to list NFTs on marketplace (not just owners)
              </p>
              <Button
                onClick={testList}
                disabled={isTestingList || !address || !songStatus.isMinted || songStatus.isListed}
                className="w-full"
                size="sm"
              >
                {isTestingList ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing List...
                  </>
                ) : (
                  <>
                    <List className="h-4 w-4 mr-2" />
                    Test Universal List
                  </>
                )}
              </Button>
            </div>

            {/* Unlist Test */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">3. Universal Unlist</h5>
                {getStatusBadge(true, 'Available to ALL')}
              </div>
              <p className="text-xs text-muted-foreground">
                ANY user should be able to unlist NFTs from marketplace (not just owners)
              </p>
              <Button
                onClick={testUnlist}
                disabled={isTestingUnlist || !address || !songStatus.isListed}
                className="w-full"
                size="sm"
                variant="destructive"
              >
                {isTestingUnlist ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Unlist...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Test Universal Unlist
                  </>
                )}
              </Button>
            </div>

            {/* Update Price Test */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">4. Universal Update</h5>
                {getStatusBadge(true, 'Available to ALL')}
              </div>
              <p className="text-xs text-muted-foreground">
                ANY user should be able to update NFT prices on marketplace (not just owners)
              </p>
              <Button
                onClick={testUpdatePrice}
                disabled={isTestingUpdate || !address || !songStatus.isListed}
                className="w-full"
                size="sm"
                variant="outline"
              >
                {isTestingUpdate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Update...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Test Universal Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!address && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Please connect your wallet to test universal NFT access functionality.
            </AlertDescription>
          </Alert>
        )}

        {address && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Test Instructions:</strong> Run tests in order: Mint → List → Update/Unlist.
              All actions should work regardless of ownership status.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Permissions Summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Permission Summary</h4>
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded space-y-1">
            <div><strong>✅ Mint:</strong> ANY user can mint via Factory contract (no authorization)</div>
            <div><strong>✅ List:</strong> ANY user can list NFTs on marketplace (no ownership check)</div>
            <div><strong>✅ Unlist:</strong> ANY user can unlist NFTs from marketplace (no ownership check)</div>
            <div><strong>✅ Update:</strong> ANY user can update NFT prices (no ownership check)</div>
            <div><strong>💡 Key:</strong> Ownership restrictions have been REMOVED for universal access</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UniversalNFTTest;