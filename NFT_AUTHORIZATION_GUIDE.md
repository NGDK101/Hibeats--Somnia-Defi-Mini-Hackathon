# NFT Authorization Setup Guide

## Problem
The user encounters a "Not authorized creator" error when trying to mint NFTs because their wallet address is not authorized in the HiBeatsNFT smart contract.

## Root Cause
Only authorized addresses can mint NFTs directly. Based on the deployment script analysis:
- Only Factory and InteractionManager contracts are automatically authorized
- Individual user wallets need to be manually authorized by the contract owner

## Solutions

### Option 1: Authorize Individual Wallet (Recommended for Testing)

You need to call `setAuthorizedCreator(address, true)` from the contract owner account.

#### Steps:
1. Open a console/terminal in the contracts directory
2. Run Hardhat console connected to your network:
   ```bash
   npx hardhat console --network somnia-testnet
   ```
3. Get the contract instance:
   ```javascript
   const contract = await ethers.getContractAt("HiBeatsNFT", "YOUR_NFT_CONTRACT_ADDRESS");
   ```
4. Authorize your wallet:
   ```javascript
   await contract.setAuthorizedCreator("YOUR_WALLET_ADDRESS", true);
   ```

#### Contract Addresses (from latest deployment):
- Check the latest deployment file in `contracts/deployments/` folder
- Look for `hiBeatsNFT` address

### Option 2: Use Factory Contract (Production Approach)

Instead of direct minting, users should generate music through the Factory contract which handles authorization automatically.

#### Implementation:
1. User requests music generation via `requestMusicGeneration()`
2. Backend processes AI generation
3. Backend calls `completeMusicGeneration()` which mints the NFT
4. User receives the minted NFT

### Option 3: Frontend Authorization Check

The current implementation now includes authorization checking before attempting to mint:

```typescript
// Check if user is authorized first
const isAuthorized = await nftOps.checkAuthorization(address);

if (!isAuthorized) {
  toast.error('Your wallet is not authorized to mint NFTs. Please contact the platform admin.');
  return;
}
```

## Current Implementation Status

✅ **Completed:**
- Authorization checking in `useNFTManager`
- Clear error messages for unauthorized users
- Real-time status checking with smart contract
- Proper button states (mint/list/update/unlist)
- NFT lifecycle management

⚠️ **Blocked:**
- Actual minting requires wallet authorization
- Only contract owner can authorize wallets

## Quick Fix for Testing

To immediately test the minting functionality:

1. Find the contract owner's private key (from deployment)
2. Use the owner account to authorize your wallet:
   ```javascript
   // In Hardhat console as contract owner
   const nft = await ethers.getContractAt("HiBeatsNFT", NFT_CONTRACT_ADDRESS);
   await nft.setAuthorizedCreator("0xYourWalletAddress", true);
   ```
3. Retry minting from the frontend

## Production Recommendation

For production, implement the Factory flow where:
1. Users generate music through the platform
2. Platform handles minting automatically
3. Users receive pre-minted NFTs
4. Users can then list/trade these NFTs

This approach:
- Maintains security (only platform can mint)
- Provides better UX (automatic minting)
- Ensures quality control
- Prevents spam minting