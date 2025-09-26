import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';

// HiBeats Profile Contract
const HIBEATS_PROFILE_CONTRACT = '0x1259D20501c2574C36d7A80c45B9bD4CbE152c6B' as const;

// Contract ABI - key functions only
const PROFILE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "username",
        "type": "string"
      }
    ],
    "name": "ProfileCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "ProfileUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "ProfileVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "StatsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "follower",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "following",
        "type": "address"
      }
    ],
    "name": "UserFollowed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "follower",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "following",
        "type": "address"
      }
    ],
    "name": "UserUnfollowed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "oldUsername",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newUsername",
        "type": "string"
      }
    ],
    "name": "UsernameChanged",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_BIO_LENGTH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_USERNAME_LENGTH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_USERNAME_LENGTH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allUsers",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_newUsername",
        "type": "string"
      }
    ],
    "name": "changeUsername",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_username",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_displayName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_bio",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_profileImageUrl",
        "type": "string"
      }
    ],
    "name": "createProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "creatorStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalTracks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalPlays",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalEarnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalSales",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalListings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalAuctions",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averagePrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "highestSale",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "followerCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "followingCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      }
    ],
    "name": "followCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      }
    ],
    "name": "getCreatorLevel",
    "outputs": [
      {
        "internalType": "enum HiBeatsProfile.CreatorLevel",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      }
    ],
    "name": "getCreatorProfile",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "displayName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "profileImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bannerImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "website",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "twitter",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "instagram",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "spotify",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "joinedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isVerified",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct HiBeatsProfile.Profile",
        "name": "profile",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalPlays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalSales",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalListings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalAuctions",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averagePrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "highestSale",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "string[]",
            "name": "topGenres",
            "type": "string[]"
          },
          {
            "internalType": "uint256[]",
            "name": "genreCounts",
            "type": "uint256[]"
          }
        ],
        "internalType": "struct HiBeatsProfile.CreatorStats",
        "name": "stats",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getFollowStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "followers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "following",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_username",
        "type": "string"
      }
    ],
    "name": "getProfileByUsername",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "displayName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "profileImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bannerImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "website",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "twitter",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "instagram",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "spotify",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "joinedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isVerified",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct HiBeatsProfile.Profile",
        "name": "profile",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalPlays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalSales",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalListings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalAuctions",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averagePrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "highestSale",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "string[]",
            "name": "topGenres",
            "type": "string[]"
          },
          {
            "internalType": "uint256[]",
            "name": "genreCounts",
            "type": "uint256[]"
          }
        ],
        "internalType": "struct HiBeatsProfile.CreatorStats",
        "name": "stats",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_limit",
        "type": "uint256"
      }
    ],
    "name": "getTopCreators",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "addresses",
        "type": "address[]"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "displayName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "profileImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bannerImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "website",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "twitter",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "instagram",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "spotify",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "joinedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isVerified",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct HiBeatsProfile.Profile[]",
        "name": "profileList",
        "type": "tuple[]"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalPlays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalSales",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalListings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalAuctions",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averagePrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "highestSale",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "string[]",
            "name": "topGenres",
            "type": "string[]"
          },
          {
            "internalType": "uint256[]",
            "name": "genreCounts",
            "type": "uint256[]"
          }
        ],
        "internalType": "struct HiBeatsProfile.CreatorStats[]",
        "name": "statsList",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasProfile",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hiBeatsNFT",
    "outputs": [
      {
        "internalType": "contract IHiBeatsNFT",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_follower",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_following",
        "type": "address"
      }
    ],
    "name": "isFollowing",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "profiles",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "displayName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bio",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "profileImageUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bannerImageUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "website",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "twitter",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "instagram",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "spotify",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "totalTracks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalEarnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "followerCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "followingCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "joinedAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isVerified",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      }
    ],
    "name": "removeVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_query",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_limit",
        "type": "uint256"
      }
    ],
    "name": "searchCreators",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "addresses",
        "type": "address[]"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "displayName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "profileImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bannerImageUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "website",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "twitter",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "instagram",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "spotify",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "joinedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isVerified",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct HiBeatsProfile.Profile[]",
        "name": "profileList",
        "type": "tuple[]"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalTracks",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalPlays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalSales",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalListings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalAuctions",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averagePrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "highestSale",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followerCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "followingCount",
            "type": "uint256"
          },
          {
            "internalType": "string[]",
            "name": "topGenres",
            "type": "string[]"
          },
          {
            "internalType": "uint256[]",
            "name": "genreCounts",
            "type": "uint256[]"
          }
        ],
        "internalType": "struct HiBeatsProfile.CreatorStats[]",
        "name": "statsList",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_nftAddress",
        "type": "address"
      }
    ],
    "name": "setNFTContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalUsers",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      }
    ],
    "name": "unfollowCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_totalTracks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalPlays",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalEarnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalSales",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalListings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalAuctions",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_averagePrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_highestSale",
        "type": "uint256"
      }
    ],
    "name": "updateCreatorStats",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      },
      {
        "internalType": "string[]",
        "name": "_topGenres",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_genreCounts",
        "type": "uint256[]"
      }
    ],
    "name": "updateGenreStats",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_displayName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_bio",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_profileImageUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_bannerImageUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_website",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_twitter",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_instagram",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_spotify",
        "type": "string"
      }
    ],
    "name": "updateProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "usernameToAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      }
    ],
    "name": "verifyCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export interface SocialProfile {
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  twitter: string;
  instagram: string;
  spotify: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  trackCount: number;
  totalPlays: number;
  totalEarnings: number;
  createdAt: number;
  creatorLevel: 'NEWCOMER' | 'RISING' | 'ESTABLISHED' | 'LEGEND';
}

export interface SocialStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

export const useSocialContract = () => {
  const { address } = useAccount();
  const [socialProfiles, setSocialProfiles] = useState<Map<string, SocialProfile>>(new Map());
  const [followData, setFollowData] = useState<Map<string, SocialStats>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Helper function to convert creator level number to string
  const getCreatorLevelString = (level: number): 'NEWCOMER' | 'RISING' | 'ESTABLISHED' | 'LEGEND' => {
    switch (level) {
      case 0: return 'NEWCOMER';
      case 1: return 'RISING';
      case 2: return 'ESTABLISHED';
      case 3: return 'LEGEND';
      default: return 'NEWCOMER';
    }
  };

  // Read profile from smart contract
  const { data: profileData, isError: profileError, refetch: refetchProfile } = useReadContract({
    address: HIBEATS_PROFILE_CONTRACT,
    abi: PROFILE_ABI,
    functionName: 'profiles',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read if user has profile
  const { data: hasProfile, refetch: refetchHasProfile } = useReadContract({
    address: HIBEATS_PROFILE_CONTRACT,
    abi: PROFILE_ABI,
    functionName: 'hasProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read creator level
  const { data: creatorLevel } = useReadContract({
    address: HIBEATS_PROFILE_CONTRACT,
    abi: PROFILE_ABI,
    functionName: 'getCreatorLevel',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get user profile by address
  const getUserProfile = useCallback(async (userAddress: string): Promise<SocialProfile | null> => {
    try {
      setError(null);
      
      // Check from cache first
      const cached = socialProfiles.get(userAddress);
      if (cached) {
        return cached;
      }

      // If no profile data available, return null
      if (!profileData || profileError) {
        return null;
      }

      // Convert contract data to profile interface
      const profile: SocialProfile = {
        address: userAddress,
        username: profileData[1] || `user_${userAddress.slice(-6)}`,
        displayName: profileData[2] || `User ${userAddress.slice(-4)}`,
        bio: profileData[3] || '',
        avatar: profileData[4] || '',
        coverImage: profileData[5] || '',
        website: profileData[6] || '',
        twitter: profileData[7] || '',
        instagram: profileData[8] || '',
        spotify: profileData[9] || '',
        isVerified: profileData[15] || false,
        followerCount: Number(profileData[12]) || 0,
        followingCount: Number(profileData[13]) || 0,
        trackCount: Number(profileData[10]) || 0,
        totalPlays: Number(profileData[11]) || 0,
        totalEarnings: Number(profileData[11]) || 0,
        createdAt: Number(profileData[14]) || Date.now(),
        creatorLevel: getCreatorLevelString(Number(creatorLevel) || 0),
      };

      // Cache the profile
      setSocialProfiles(prev => new Map(prev).set(userAddress, profile));
      
      return profile;
    } catch (err: any) {
      console.error('❌ Error getting profile:', err);
      setError(err.message || 'Failed to get profile');
      return null;
    }
  }, [profileData, profileError, creatorLevel, socialProfiles]);

  // Get profile from current state (synchronous)
  const getProfileFromState = useCallback((userAddress: string): SocialProfile | null => {
    if (userAddress === address && profileData && hasProfile) {
      const profile: SocialProfile = {
        address: userAddress,
        username: profileData[1] || `user_${userAddress.slice(-6)}`,
        displayName: profileData[2] || `User ${userAddress.slice(-4)}`,
        bio: profileData[3] || '',
        avatar: profileData[4] || '',
        coverImage: profileData[5] || '',
        website: profileData[6] || '',
        twitter: profileData[7] || '',
        instagram: profileData[8] || '',
        spotify: profileData[9] || '',
        isVerified: profileData[15] || false,
        followerCount: Number(profileData[12]) || 0,
        followingCount: Number(profileData[13]) || 0,
        trackCount: Number(profileData[10]) || 0,
        totalPlays: Number(profileData[11]) || 0,
        totalEarnings: Number(profileData[11]) || 0,
        createdAt: Number(profileData[14]) || Date.now(),
        creatorLevel: getCreatorLevelString(Number(creatorLevel) || 0),
      };
      return profile;
    }
    return socialProfiles.get(userAddress) || null;
  }, [address, profileData, hasProfile, creatorLevel, socialProfiles]);

  // Create or update profile
  const updateProfile = useCallback(async (profileData: Partial<SocialProfile>) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);


      // Check if user has profile first
      if (!hasProfile) {
        // Create new profile
        // @ts-ignore - wagmi type configuration issue
        writeContract({
          address: HIBEATS_PROFILE_CONTRACT,
          abi: PROFILE_ABI,
          functionName: 'createProfile',
          args: [
            profileData.username || `user_${address.slice(-6)}`,
            profileData.displayName || `User ${address.slice(-4)}`,
            profileData.bio || '',
            profileData.avatar || ''
          ] as const,
        });
      } else {
        // Update existing profile
        
        // Get current profile data and provide robust fallbacks
        let currentProfile = getProfileFromState(address);
        
        // If current profile is null, try to fetch it or use safe defaults
        if (!currentProfile) {
          currentProfile = {
            address: address,
            username: `user_${address.slice(-6)}`,
            displayName: `User ${address.slice(-4)}`,
            bio: '',
            avatar: '',
            coverImage: '',
            website: '',
            twitter: '',
            instagram: '',
            spotify: '',
            followerCount: 0,
            followingCount: 0,
            trackCount: 0,
            totalPlays: 0,
            isVerified: false,
            totalEarnings: 0,
            createdAt: Date.now(),
            creatorLevel: 'NEWCOMER' as const,
          };
        }
        
        // Merge with new data and ensure all fields are present
        const updatedData = {
          displayName: profileData.displayName ?? currentProfile.displayName ?? `User ${address.slice(-4)}`,
          bio: profileData.bio ?? currentProfile.bio ?? '',
          avatar: profileData.avatar ?? currentProfile.avatar ?? '',
          coverImage: profileData.coverImage ?? currentProfile.coverImage ?? '',
          website: profileData.website ?? currentProfile.website ?? '',
          twitter: profileData.twitter ?? currentProfile.twitter ?? '',
          instagram: profileData.instagram ?? currentProfile.instagram ?? '',
          spotify: profileData.spotify ?? currentProfile.spotify ?? ''
        };

        // Validate all required fields before sending
        // Ensure all fields are strings - 8 parameters for updateProfile
        const contractArgs: [string, string, string, string, string, string, string, string] = [
          String(updatedData.displayName || ''),
          String(updatedData.bio || ''),
          String(updatedData.avatar || ''),
          String(updatedData.coverImage || ''),
          String(updatedData.website || ''),
          String(updatedData.twitter || ''),
          String(updatedData.instagram || ''),
          String(updatedData.spotify || '')
        ];
        
        
        // @ts-ignore - wagmi type configuration issue
        writeContract({
          address: HIBEATS_PROFILE_CONTRACT,
          abi: PROFILE_ABI,
          functionName: 'updateProfile',
          args: contractArgs,
        });
        
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error('❌ Profile update failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, hasProfile, writeContract, getProfileFromState]);

  // Follow user
  const followUser = useCallback(async (targetAddress: string) => {
    if (!address || !targetAddress) return false;

    try {
      setError(null);
      setIsLoading(true);

      
      // @ts-ignore - wagmi type configuration issue
      writeContract({
        address: HIBEATS_PROFILE_CONTRACT,
        abi: PROFILE_ABI,
        functionName: 'followCreator',
        args: [targetAddress as `0x${string}`] as const,
      });

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to follow user');
      console.error('❌ Follow failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract]);

  // Unfollow user
  const unfollowUser = useCallback(async (targetAddress: string) => {
    if (!address || !targetAddress) return false;

    try {
      setError(null);
      setIsLoading(true);

      
      // @ts-ignore - wagmi type configuration issue
      writeContract({
        address: HIBEATS_PROFILE_CONTRACT,
        abi: PROFILE_ABI,
        functionName: 'unfollowCreator',
        args: [targetAddress as `0x${string}`] as const,
      });

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to unfollow user');
      console.error('❌ Unfollow failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract]);

  // Get social stats for user
  const getSocialStats = useCallback(async (userAddress: string, viewerAddress?: string): Promise<SocialStats> => {
    const defaultStats: SocialStats = {
      followerCount: 0,
      followingCount: 0,
      isFollowing: false,
      isFollowedBy: false,
    };

    try {
      // Get basic stats from profile
      const profile = await getUserProfile(userAddress);
      if (profile) {
        defaultStats.followerCount = profile.followerCount;
        defaultStats.followingCount = profile.followingCount;
      }

      return defaultStats;
    } catch (err) {
      console.error('❌ Error getting social stats:', err);
      return defaultStats;
    }
  }, [getUserProfile]);

  // Effect to refetch profile when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      // Add a small delay to ensure the blockchain state is updated
      setTimeout(() => {
        refetchProfile();
      }, 1000);
      setIsLoading(false);
    }
  }, [isSuccess, refetchProfile]);

  // Effect to handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Transaction error:', writeError);
      setError(writeError.message || 'Transaction failed');
      setIsLoading(false);
    }
  }, [writeError]);

  // Refresh profile data function
  const refreshProfileData = useCallback(async () => {
    if (address) {
      
      try {
        // Refresh all profile-related queries
        const results = await Promise.all([
          refetchProfile(),
          refetchHasProfile()
        ]);

        // Clear cache to force fresh data
        setSocialProfiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(address);
          return newMap;
        });
        
      } catch (error) {
        console.error('❌ Error refreshing profile data:', error);
      }
    } else {
    }
  }, [address, refetchProfile, refetchHasProfile]);

  return {
    // State
    socialProfiles,
    followData,
    isLoading: isLoading || isPending || isConfirming,
    error,
    hasProfile: !!hasProfile,
    
    // Actions
    updateProfile,
    followUser,
    unfollowUser,
    getUserProfile,
    getProfileFromState,
    getSocialStats,
    refreshProfileData,
    
    // Contract state
    isTransactionPending: isPending,
    isTransactionConfirming: isConfirming,
    transactionHash: hash,
  };
};

export default useSocialContract;