export const HIBEATS_PROFILE_ABI = [
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