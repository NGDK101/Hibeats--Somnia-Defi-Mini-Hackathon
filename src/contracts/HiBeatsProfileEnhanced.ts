export const HIBEATS_PROFILE_ENHANCED_ABI = [
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
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum HiBeatsProfileEnhanced.AchievementType",
          "name": "achievementType",
          "type": "uint8"
        }
      ],
      "name": "AchievementUnlocked",
      "type": "event"
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
      "name": "ProfileFeatured",
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
      "name": "ProfileUnfeatured",
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
      "name": "MAX_GENRES",
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
      "name": "MAX_SOCIAL_LINKS",
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
          "internalType": "address",
          "name": "_creator",
          "type": "address"
        }
      ],
      "name": "checkFeaturedEligibility",
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
          "name": "_avatar",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_location",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "_genres",
          "type": "string[]"
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
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "featureCreator",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "name": "featuredCreators",
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
      "name": "featuredCriteria",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "minFollowers",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minTracks",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minPlays",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minEarnings",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "requireVerification",
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
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "followUser",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "name": "getCreatorLevel",
      "outputs": [
        {
          "internalType": "enum HiBeatsProfileEnhanced.CreatorLevel",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getFeaturedStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalFeatured",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalVerified",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalActive",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "avgFollowers",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "avgTracks",
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
          "name": "",
          "type": "address"
        },
        {
          "internalType": "enum HiBeatsProfileEnhanced.AchievementType",
          "name": "",
          "type": "uint8"
        }
      ],
      "name": "hasAchievement",
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
          "name": "avatar",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "coverImage",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "website",
          "type": "string"
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
        },
        {
          "internalType": "bool",
          "name": "isFeatured",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
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
          "name": "trackCount",
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
          "name": "featuredSince",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "achievementCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "weeklyPlays",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "monthlyPlays",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "location",
          "type": "string"
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
      "name": "readCreatorAchievements",
      "outputs": [
        {
          "components": [
            {
              "internalType": "enum HiBeatsProfileEnhanced.AchievementType",
              "name": "achievementType",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "unlockedAt",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isRare",
              "type": "bool"
            }
          ],
          "internalType": "struct HiBeatsProfileEnhanced.Achievement[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_genre",
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
      "name": "readCreatorsByGenre",
      "outputs": [
        {
          "components": [
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
              "name": "avatar",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "coverImage",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "website",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "socialLinks",
              "type": "string[]"
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
            },
            {
              "internalType": "bool",
              "name": "isFeatured",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
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
              "name": "trackCount",
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
              "name": "featuredSince",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "achievementCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "weeklyPlays",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "monthlyPlays",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "genres",
              "type": "string[]"
            }
          ],
          "internalType": "struct HiBeatsProfileEnhanced.Profile[]",
          "name": "creatorList",
          "type": "tuple[]"
        },
        {
          "internalType": "address[]",
          "name": "addresses",
          "type": "address[]"
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
      "name": "readFeaturedCreators",
      "outputs": [
        {
          "components": [
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
              "name": "avatar",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "coverImage",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "website",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "socialLinks",
              "type": "string[]"
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
            },
            {
              "internalType": "bool",
              "name": "isFeatured",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
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
              "name": "trackCount",
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
              "name": "featuredSince",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "achievementCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "weeklyPlays",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "monthlyPlays",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "genres",
              "type": "string[]"
            }
          ],
          "internalType": "struct HiBeatsProfileEnhanced.Profile[]",
          "name": "creatorList",
          "type": "tuple[]"
        },
        {
          "internalType": "address[]",
          "name": "addresses",
          "type": "address[]"
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
      "name": "readNewCreators",
      "outputs": [
        {
          "components": [
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
              "name": "avatar",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "coverImage",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "website",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "socialLinks",
              "type": "string[]"
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
            },
            {
              "internalType": "bool",
              "name": "isFeatured",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
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
              "name": "trackCount",
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
              "name": "featuredSince",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "achievementCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "weeklyPlays",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "monthlyPlays",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "genres",
              "type": "string[]"
            }
          ],
          "internalType": "struct HiBeatsProfileEnhanced.Profile[]",
          "name": "creatorList",
          "type": "tuple[]"
        },
        {
          "internalType": "address[]",
          "name": "addresses",
          "type": "address[]"
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
      "name": "readTrendingCreators",
      "outputs": [
        {
          "components": [
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
              "name": "avatar",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "coverImage",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "website",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "socialLinks",
              "type": "string[]"
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
            },
            {
              "internalType": "bool",
              "name": "isFeatured",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
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
              "name": "trackCount",
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
              "name": "featuredSince",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "achievementCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "weeklyPlays",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "monthlyPlays",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "genres",
              "type": "string[]"
            }
          ],
          "internalType": "struct HiBeatsProfileEnhanced.Profile[]",
          "name": "creatorList",
          "type": "tuple[]"
        },
        {
          "internalType": "address[]",
          "name": "addresses",
          "type": "address[]"
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
      "name": "readVerifiedCreators",
      "outputs": [
        {
          "components": [
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
              "name": "avatar",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "coverImage",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "website",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "socialLinks",
              "type": "string[]"
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
            },
            {
              "internalType": "bool",
              "name": "isFeatured",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
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
              "name": "trackCount",
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
              "name": "featuredSince",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "achievementCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "weeklyPlays",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "monthlyPlays",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string[]",
              "name": "genres",
              "type": "string[]"
            }
          ],
          "internalType": "struct HiBeatsProfileEnhanced.Profile[]",
          "name": "creatorList",
          "type": "tuple[]"
        },
        {
          "internalType": "address[]",
          "name": "addresses",
          "type": "address[]"
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
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_minFollowers",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_minTracks",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_minPlays",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_minEarnings",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_requireVerification",
          "type": "bool"
        }
      ],
      "name": "setFeaturedCriteria",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalFeaturedCreators",
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
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "unfeatureCreator",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "name": "unfollowUser",
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
          "name": "_avatar",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_coverImage",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_website",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_location",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "_genres",
          "type": "string[]"
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
          "internalType": "string[]",
          "name": "_socialLinks",
          "type": "string[]"
        }
      ],
      "name": "updateSocialLinks",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_trackCount",
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
          "name": "_weeklyPlays",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_monthlyPlays",
          "type": "uint256"
        }
      ],
      "name": "updateStats",
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
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "userAchievements",
      "outputs": [
        {
          "internalType": "enum HiBeatsProfileEnhanced.AchievementType",
          "name": "achievementType",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "unlockedAt",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isRare",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "verifiedCreators",
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
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "verifyCreator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const;
