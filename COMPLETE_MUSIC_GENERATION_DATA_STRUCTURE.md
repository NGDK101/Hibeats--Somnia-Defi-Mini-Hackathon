# Complete Music Generation Data Structure Validation

## Smart Contract Expected Parameters

Based on the Factory ABI, the `completeMusicGeneration` function expects these parameters:

```solidity
function completeMusicGeneration(
    uint256 requestId,      // Must be > 0
    string metadataURI,     // Must start with 'ipfs://'
    uint256 duration,       // Must be > 0 (in seconds)
    string tags,            // Must not be empty
    string modelName,       // Must not be empty (e.g., 'V4')
    uint256 createTime      // Unix timestamp
)
```

## Current Implementation

### Data Preparation (NFTMintRoadmapModal.tsx)

```typescript
// Generate requestId from song ID or timestamp
let requestId: number;
if (selectedSong?.id) {
  const parsedId = parseInt(selectedSong.id.replace(/[^0-9]/g, ''));
  requestId = parsedId > 0 ? parsedId : Math.floor(Date.now() / 1000);
} else {
  requestId = Math.floor(Date.now() / 1000);
}

// Ensure duration is positive integer
const songDuration = Math.max(1, Math.floor(formData.duration > 0 ? formData.duration : (selectedSong?.duration || 30)));

// Ensure tags are not empty
const songTags = (formData.tags || 
  selectedSong?.genre?.join(', ') || 
  'ai-generated, music, nft').trim();

// Ensure model name is not empty
const modelName = (formData.modelUsed || 'V4').trim();

const completionParams = {
  requestId: requestId,                    // number
  metadataURI: metadataUri.trim(),        // string (ipfs://...)
  duration: songDuration,                 // number (seconds)
  tags: songTags,                         // string
  modelName: modelName,                   // string
  createTime: Math.floor(Date.now() / 1000) // number (unix timestamp)
};
```

### Frontend Validation

```typescript
// Validate all parameters before calling
if (!Number.isInteger(completionParams.requestId) || completionParams.requestId <= 0) {
  throw new Error(`Invalid request ID: ${completionParams.requestId}`);
}
if (!completionParams.metadataURI || !completionParams.metadataURI.startsWith('ipfs://')) {
  throw new Error(`Invalid metadata URI: ${completionParams.metadataURI}`);
}
if (!Number.isInteger(completionParams.duration) || completionParams.duration <= 0) {
  throw new Error(`Invalid duration: ${completionParams.duration}`);
}
if (!completionParams.tags || completionParams.tags.trim().length === 0) {
  throw new Error(`Tags are required: "${completionParams.tags}"`);
}
if (!completionParams.modelName || completionParams.modelName.trim().length === 0) {
  throw new Error(`Model name is required: "${completionParams.modelName}"`);
}
if (!Number.isInteger(completionParams.createTime) || completionParams.createTime <= 0) {
  throw new Error(`Invalid createTime: ${completionParams.createTime}`);
}
```

### Hook Implementation (useFactoryMint.ts)

```typescript
// Convert to BigInt for contract call
writeContract({
  address: CONTRACT_ADDRESSES.HIBEATS_FACTORY as `0x${string}`,
  abi: HIBEATS_FACTORY_ABI,
  functionName: 'completeMusicGeneration',
  args: [
    BigInt(params.requestId),    // uint256
    params.metadataURI,          // string
    BigInt(params.duration),     // uint256
    params.tags,                 // string
    params.modelName,            // string
    BigInt(params.createTime)    // uint256
  ],
});
```

## Common Issues and Solutions

1. **RequestId = 0**: Fixed by ensuring minimum value of 1 or using timestamp
2. **Empty strings**: Fixed by providing fallback values and trimming
3. **Invalid duration**: Fixed by ensuring positive integer values
4. **Contract address not configured**: Added validation check
5. **Wrong data types**: Fixed by proper type conversion to BigInt

## Debug Information

The implementation now logs detailed parameter information:

```typescript
console.log('🎵 Preparing completeMusicGeneration with params:', {
  ...completionParams,
  requestId_type: typeof completionParams.requestId,
  duration_type: typeof completionParams.duration,
  createTime_type: typeof completionParams.createTime
});
```

## Error Handling

Enhanced error handling captures:
- Contract revert reasons
- Parameter validation errors
- Network and gas issues
- Transaction rejection by user
- Contract configuration problems