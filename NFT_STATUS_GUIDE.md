# NFT Status Management System

## Overview
Sistem NFT Status Management memungkinkan aplikasi untuk:
1. ✅ **Cek status song** - Apakah sudah di-mint atau belum
2. ✅ **Update ke list NFT** - Jika sudah mint, tampilkan di marketplace
3. ✅ **Manage listing/unlisting** - List, unlist, dan update price NFT
4. ✅ **Real-time status** - Data langsung dari smart contract

## Architecture

### Hooks
```typescript
// 1. useSongStatus - Cek status real-time dari smart contract
const { status, isMinted, isListed, isOwner, tokenId, canMint, canList, canUnlist } = useSongStatus(aiTrackId);

// 2. useNFTManager - Manage semua NFT actions
const { handleAction, getActionButtonConfig, isLoading } = useNFTManager();

// 3. useMarketplace - Extended dengan NFT functions
const { checkSongMintStatus, checkNFTListingStatus, unlistNFT, getSongStatus } = useMarketplace();
```

### Components
```typescript
// 1. NFTActionButtons - Smart buttons berdasarkan status
<NFTActionButtons aiTrackId={song.id} songData={songInfo} />

// 2. NFTGrid - Grid view untuk collections
<NFTGrid songs={songs} loading={loading} />
```

## Status Flow

### 1. Not Minted (not-minted)
- **Show**: "Mint NFT" button
- **Action**: Mint song ke blockchain
- **Next State**: minted-not-listed

### 2. Minted Not Listed (minted-not-listed)
- **Show**: "List NFT" button  
- **Action**: List NFT di marketplace
- **Next State**: minted-listed

### 3. Minted Listed (minted-listed)
- **Show**: "Update Price" + "Unlist NFT" buttons
- **Actions**: 
  - Update listing price
  - Unlist dari marketplace → kembali ke "minted-not-listed"

### 4. Minted Not Owner (minted-not-owner)
- **Show**: "Owned by Others" (disabled)
- **Action**: View only

### 5. Error State (error)
- **Show**: Error message
- **Action**: Retry or contact support

## Smart Contract Integration

### NFT Contract Methods Used:
```solidity
// Check if song already minted
function trackExists(string aiTrackId) → bool

// Get token ID from AI track ID  
function getTokenIdByAITrackId(string aiTrackId) → uint256

// Get token owner
function ownerOf(uint256 tokenId) → address
```

### Marketplace Contract Methods Used:
```solidity
// Check listing status
function getListing(uint256 tokenId) → Listing

// List NFT
function listToken(uint256 tokenId, uint256 price, ...) 

// Unlist NFT
function unlistToken(uint256 tokenId)

// Update price
function updatePrice(uint256 tokenId, uint256 newPrice)
```

## Usage Examples

### Basic Status Check
```typescript
import { useSongStatus } from '@/hooks/useSongStatus';

function SongCard({ aiTrackId }) {
  const { status, isLoading, canMint, canList, canUnlist } = useSongStatus(aiTrackId);
  
  if (isLoading) return <Loader />;
  
  return (
    <div>
      <p>Status: {status}</p>
      {canMint && <button>Mint NFT</button>}
      {canList && <button>List NFT</button>}
      {canUnlist && <button>Unlist NFT</button>}
    </div>
  );
}
```

### Complete NFT Management
```typescript
import { useNFTManager } from '@/hooks/useNFTManager';

function SongManager({ aiTrackId }) {
  const nftManager = useNFTManager();
  
  const handleMint = async () => {
    await nftManager.handleAction('mint', { aiTrackId });
  };
  
  const handleList = async () => {
    await nftManager.handleAction('list', { 
      aiTrackId, 
      tokenId: 123n, 
      price: '0.1' 
    });
  };
  
  return <NFTActionButtons aiTrackId={aiTrackId} />;
}
```

### Library Page Integration
```typescript
// Already implemented in LibraryPage.tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="songs">Songs</TabsTrigger>
    <TabsTrigger value="nfts">NFTs</TabsTrigger> {/* New tab */}
  </TabsList>
  
  <TabsContent value="songs">
    {songs.map(song => (
      <div key={song.id}>
        {/* Song info */}
        <NFTActionButtons aiTrackId={song.id} songData={song} />
      </div>
    ))}
  </TabsContent>
  
  <TabsContent value="nfts">
    <NFTGrid songs={songs} /> {/* Grid view dengan NFT status */}
  </TabsContent>
</Tabs>
```

## Button States

### Visual States
- **Mint NFT**: Blue button (bg-blue-600)
- **List NFT**: Green button (bg-green-600)  
- **Update Price**: Orange outline (border-orange-500)
- **Unlist NFT**: Red button (bg-red-600)
- **Owned by Others**: Gray disabled (border-gray-300)
- **Error**: Gray disabled (bg-gray-400)

### Loading States
- All buttons show spinner when `isLoading: true`
- Disabled state during transactions

## Error Handling

### Contract Errors
```typescript
// Automatic error handling in hooks
const { error } = useSongStatus(aiTrackId);

if (error) {
  // Show error state
  return <ErrorComponent error={error} />;
}
```

### Transaction Errors
- Toast notifications for success/failure
- Automatic retry options
- User-friendly error messages

## Real-time Updates

### Auto Refresh
```typescript
// Hooks automatically refetch after successful transactions
const { refetch } = useSongStatus(aiTrackId);

// Manual refresh
await refetch();
```

### Transaction Monitoring
- Wagmi `useWaitForTransactionReceipt` integration
- Automatic status updates after confirmation
- Loading states during pending transactions

## Performance Optimizations

### React Query Integration
- Cached responses untuk status checks
- Automatic background refetching
- Optimistic updates

### Efficient Contract Calls
- Batch multiple status checks
- Only call when needed (enabled flags)
- Error boundaries untuk fault tolerance

## Testing

### Test Cases
1. ✅ Song not minted → Show mint button
2. ✅ Song minted but not listed → Show list button
3. ✅ Song listed → Show update + unlist buttons
4. ✅ Song owned by others → Show view only
5. ✅ Transaction loading states
6. ✅ Error handling
7. ✅ Real-time status updates

### Mock Data
```typescript
// For testing without smart contract
const mockSongStatus = {
  status: 'minted-not-listed',
  isMinted: true,
  isListed: false,
  isOwner: true,
  tokenId: 123n,
  canMint: false,
  canList: true,
  canUnlist: false,
};
```

## Deployment Checklist

- [x] Smart contracts deployed dan verified
- [x] Contract addresses updated di config
- [x] ABIs exported dari contracts
- [x] Hooks implemented dan tested
- [x] Components created dan styled
- [x] Library page updated
- [x] Error handling implemented
- [x] Loading states implemented
- [x] Real-time updates working
- [x] Transaction monitoring working

## Future Enhancements

### Planned Features
1. **Batch Operations**: Mint/list multiple songs sekaligus
2. **Price History**: Track NFT price changes
3. **Sale Analytics**: Revenue tracking per NFT
4. **Collection Management**: Group NFTs by artist/album
5. **Royalty Management**: Configure royalty rates
6. **Auction Support**: Time-based auctions
7. **Offer System**: Make/accept offers on NFTs

### Technical Improvements
1. **Optimistic Updates**: UI updates before transaction confirm
2. **Offline Support**: Cache status for offline viewing
3. **Push Notifications**: Alert on status changes
4. **Advanced Filtering**: Filter NFTs by status/price
5. **Export Functions**: Export NFT data

## Support

Jika ada issues atau questions:
1. Check console untuk error logs
2. Verify wallet connection
3. Check smart contract addresses
4. Ensure proper network (Somnia testnet)
5. Contact dev team di Discord/Telegram