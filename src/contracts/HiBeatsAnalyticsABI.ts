export const HIBEATS_ANALYTICS_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_hiBeatsNFT",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_hiBeatsToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_hiBeatsProfile",
        "type": "address"
      }
    ],
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
        "indexed": true,
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AnalyticsEventRecorded",
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
        "name": "reporter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      }
    ],
    "name": "ReportingRewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "source",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "RevenueRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "marketSentiment",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "topGenre",
        "type": "string"
      }
    ],
    "name": "TrendsUpdated",
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
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalTracks",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPlays",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalEarnings",
        "type": "uint256"
      }
    ],
    "name": "UserAnalyticsUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "analyticsEvents",
    "outputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "metadata",
        "type": "bytes32"
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
    "name": "authorizedReporters",
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
        "internalType": "uint256",
        "name": "batchSize",
        "type": "uint256"
      }
    ],
    "name": "cleanOldData",
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
    "name": "creatorRankings",
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
    "name": "currentTrends",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "marketSentiment",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averagePrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "volatilityIndex",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "mostPopularGenre",
        "type": "string"
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
    "name": "dailyActiveUsers",
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
    "name": "dailyNewUsers",
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
    "name": "dailyTrackCreations",
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
    "name": "dataRetentionPeriod",
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
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "eventTypeIds",
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
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "genrePopularity",
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
    "name": "getCurrentTrends",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256[]",
            "name": "trendingGenres",
            "type": "uint256[]"
          },
          {
            "internalType": "address[]",
            "name": "risingCreators",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "hotTracks",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "marketSentiment",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averagePrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "volatilityIndex",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "mostPopularGenre",
            "type": "string"
          }
        ],
        "internalType": "struct HiBeatsAnalytics.MarketTrends",
        "name": "",
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
        "name": "startDay",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endDay",
        "type": "uint256"
      }
    ],
    "name": "getDailyActiveUsers",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum HiBeatsAnalytics.TimePeriod",
        "name": "period",
        "type": "uint8"
      }
    ],
    "name": "getPlatformMetrics",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalUsers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "activeUsers",
            "type": "uint256"
          },
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
            "name": "totalRevenue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averageTrackPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "marketVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "stakingTVL",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "mostPopularGenre",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "topCreator",
            "type": "address"
          }
        ],
        "internalType": "struct HiBeatsAnalytics.PlatformMetrics",
        "name": "",
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
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getPopularGenres",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "genres",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "popularity",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRevenueAnalytics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalRevenue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "creatorEarnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "platformFees",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stakingRewards",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "marketplaceVolume",
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
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getTopCreators",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "creators",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "earnings",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getTrackAnalytics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalPlays",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "uniqueListeners",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averageListenTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "likeRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "shareCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "revenue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "marketValue",
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
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getTrackEvents",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "eventType",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "metadata",
            "type": "bytes32"
          }
        ],
        "internalType": "struct HiBeatsAnalytics.AnalyticsEvent[]",
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
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserAnalytics",
    "outputs": [
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
            "name": "totalSpent",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averageSessionTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastActiveTime",
            "type": "uint256"
          },
          {
            "internalType": "string[]",
            "name": "favoriteGenres",
            "type": "string[]"
          },
          {
            "internalType": "uint256[]",
            "name": "topTracks",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "socialScore",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "creatorScore",
            "type": "uint256"
          }
        ],
        "internalType": "struct HiBeatsAnalytics.UserAnalytics",
        "name": "",
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
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserDashboard",
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
        "name": "socialScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "recentTracks",
        "type": "uint256[]"
      },
      {
        "internalType": "string[]",
        "name": "favoriteGenres",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getUserEvents",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "eventType",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "metadata",
            "type": "bytes32"
          }
        ],
        "internalType": "struct HiBeatsAnalytics.AnalyticsEvent[]",
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
    "name": "hasReportedToday",
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
    "name": "hiBeatsMarketplace",
    "outputs": [
      {
        "internalType": "contract IHiBeatsMarketplace",
        "name": "",
        "type": "address"
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
    "inputs": [],
    "name": "hiBeatsProfile",
    "outputs": [
      {
        "internalType": "contract IHiBeatsProfile",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hiBeatsToken",
    "outputs": [
      {
        "internalType": "contract IHiBeatsToken",
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
    "name": "historicalTrends",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "marketSentiment",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averagePrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "volatilityIndex",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "mostPopularGenre",
        "type": "string"
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
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "platformMetricsByPeriod",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalUsers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "activeUsers",
        "type": "uint256"
      },
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
        "name": "totalRevenue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averageTrackPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "marketVolume",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stakingTVL",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "mostPopularGenre",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "topCreator",
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
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "metadata",
        "type": "bytes32"
      }
    ],
    "name": "recordEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "sessionTime",
        "type": "uint256"
      }
    ],
    "name": "recordPlay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "interactionType",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "targetUser",
        "type": "address"
      }
    ],
    "name": "recordSocialInteraction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "genre",
        "type": "string"
      }
    ],
    "name": "recordTrackCreation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isBeatsToken",
        "type": "bool"
      }
    ],
    "name": "recordTransaction",
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
    "inputs": [],
    "name": "reportingReward",
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
    "name": "revenueAnalytics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalRevenue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "creatorEarnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "platformFees",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stakingRewards",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "marketplaceVolume",
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
        "name": "reporter",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "authorized",
        "type": "bool"
      }
    ],
    "name": "setAuthorizedReporter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_marketplace",
        "type": "address"
      }
    ],
    "name": "setMarketplaceContract",
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
    "name": "trackAnalytics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalPlays",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "uniqueListeners",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averageListenTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "skipRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "likeRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "shareCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "revenue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "marketValue",
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
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "trackEventIds",
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
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newPeriod",
        "type": "uint256"
      }
    ],
    "name": "updateDataRetentionPeriod",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum HiBeatsAnalytics.TimePeriod",
        "name": "period",
        "type": "uint8"
      }
    ],
    "name": "updatePlatformMetrics",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newReward",
        "type": "uint256"
      }
    ],
    "name": "updateReportingReward",
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
    "name": "userAnalytics",
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
        "name": "totalSpent",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averageSessionTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastActiveTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "socialScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "creatorScore",
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
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userEventIds",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
